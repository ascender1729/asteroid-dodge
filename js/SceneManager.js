class SceneManager {
    constructor(container) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);

        this.camera.position.z = 5;

        this.spacecraft = new Spacecraft(this.scene);
        this.asteroids = [];
        this.powerUps = [];
        this.projectiles = [];
        this.ui = new UI();

        this.setupLighting();
        this.addStarfield();
        this.addShootingStars();
        this.addDistantGalaxies();

        this.clock = new THREE.Clock();
        this.spawnTimer = 0;
        this.difficulty = 1;
        this.score = 0;
        this.scoreMultiplier = 1;
        this.lastScoreUpdate = Date.now();

        this.gameActive = false;

        this.sounds = {
            background: new Howl({ src: ['sounds/background.mp3'], loop: true, volume: 0.5 }),
            shoot: new Howl({ src: ['sounds/shoot.mp3'], volume: 0.5 }),
            explosion: new Howl({ src: ['sounds/explosion.mp3'], volume: 0.5 }),
            powerUp: new Howl({ src: ['sounds/powerup.mp3'], volume: 0.5 })
        };
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
        this.scene.add(hemisphereLight);
    }

    addStarfield() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        for (let i = 0; i < 10000; i++) {
            vertices.push(
                Math.random() * 2000 - 1000,
                Math.random() * 2000 - 1000,
                Math.random() * 2000 - 1000
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
        const starfield = new THREE.Points(geometry, material);
        this.scene.add(starfield);
    }

    addShootingStars() {
        this.shootingStars = [];
        for (let i = 0; i < 20; i++) {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(6); // Two points for each shooting star
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const material = new THREE.LineBasicMaterial({ color: 0xffffff });
            const shootingStar = new THREE.Line(geometry, material);
            
            this.resetShootingStar(shootingStar);
            this.scene.add(shootingStar);
            this.shootingStars.push(shootingStar);
        }
    }

    resetShootingStar(shootingStar) {
        const positions = shootingStar.geometry.attributes.position.array;
        const x = Math.random() * 2000 - 1000;
        const y = Math.random() * 1000 + 500;
        const z = Math.random() * 2000 - 1000;
        positions[0] = x;
        positions[1] = y;
        positions[2] = z;
        positions[3] = x - 20;
        positions[4] = y - 20;
        positions[5] = z;
        shootingStar.geometry.attributes.position.needsUpdate = true;
    }

    updateShootingStars(delta) {
        this.shootingStars.forEach(shootingStar => {
            const positions = shootingStar.geometry.attributes.position.array;
            positions[0] -= 100 * delta;
            positions[1] -= 100 * delta;
            positions[3] -= 100 * delta;
            positions[4] -= 100 * delta;

            if (positions[1] < -500) {
                this.resetShootingStar(shootingStar);
            }

            shootingStar.geometry.attributes.position.needsUpdate = true;
        });
    }

    addDistantGalaxies() {
        const galaxyTextures = [
            'textures/galaxy1.png',
            'textures/galaxy2.png',
            'textures/galaxy3.png'
        ];

        for (let i = 0; i < 5; i++) {
            const texture = new THREE.TextureLoader().load(galaxyTextures[Math.floor(Math.random() * galaxyTextures.length)]);
            const material = new THREE.SpriteMaterial({ map: texture, color: 0xffffff });
            const sprite = new THREE.Sprite(material);

            sprite.position.set(
                Math.random() * 2000 - 1000,
                Math.random() * 2000 - 1000,
                -900 + Math.random() * 200
            );

            const scale = Math.random() * 100 + 50;
            sprite.scale.set(scale, scale, 1);

            this.scene.add(sprite);
        }
    }

    startGame() {
        this.gameActive = true;
        this.sounds.background.play();
    }

    resetGame() {
        this.spacecraft.reset();
        this.asteroids.forEach(asteroid => this.scene.remove(asteroid.mesh));
        this.asteroids = [];
        this.powerUps.forEach(powerUp => this.scene.remove(powerUp.mesh));
        this.powerUps = [];
        this.projectiles.forEach(projectile => this.scene.remove(projectile.mesh));
        this.projectiles = [];
        this.difficulty = 1;
        this.score = 0;
        this.scoreMultiplier = 1;
        this.lastScoreUpdate = Date.now();
        this.ui.reset();
        this.gameActive = false;
        this.sounds.background.stop();
    }

    spawnAsteroid() {
        const asteroid = new Asteroid(this.scene);
        this.asteroids.push(asteroid);
    }

    spawnPowerUp() {
        const powerUp = new PowerUp(this.scene);
        this.powerUps.push(powerUp);
    }

    update() {
        if (!this.gameActive) return;

        const delta = this.clock.getDelta();
        this.spawnTimer += delta;

        if (this.spawnTimer > 2 / this.difficulty) {
            this.spawnAsteroid();
            this.spawnTimer = 0;
        }

        if (Math.random() < 0.001 * this.difficulty) {
            this.spawnPowerUp();
        }

        this.spacecraft.update(delta);
        this.updateAsteroids(delta);
        this.updatePowerUps(delta);
        this.updateProjectiles(delta);
        this.updateShootingStars(delta);

        this.checkCollisions();

        this.updateScore(delta);

        this.difficulty += delta * 0.01;

        this.renderer.render(this.scene, this.camera);
    }

    updateAsteroids(delta) {
        this.asteroids.forEach((asteroid, index) => {
            asteroid.update(delta);
            if (asteroid.isOutOfBounds()) {
                this.scene.remove(asteroid.mesh);
                this.asteroids.splice(index, 1);
            }
        });
    }

    updatePowerUps(delta) {
        this.powerUps.forEach((powerUp, index) => {
            powerUp.update(delta);
            if (powerUp.isOutOfBounds()) {
                this.scene.remove(powerUp.mesh);
                this.powerUps.splice(index, 1);
            }
        });
    }

    updateProjectiles(delta) {
        this.projectiles.forEach((projectile, index) => {
            projectile.update(delta);
            if (projectile.isOutOfBounds()) {
                this.scene.remove(projectile.mesh);
                this.projectiles.splice(index, 1);
            }
        });
    }

    checkCollisions() {
        const spacecraftBB = new THREE.Box3().setFromObject(this.spacecraft.mesh);

        this.asteroids.forEach((asteroid, aIndex) => {
            const asteroidBB = new THREE.Box3().setFromObject(asteroid.mesh);
            if (spacecraftBB.intersectsBox(asteroidBB)) {
                this.spacecraft.damage(10);
                this.ui.updateHealth(this.spacecraft.health);
                this.ui.updateShield(this.spacecraft.shield);
                this.scene.remove(asteroid.mesh);
                this.asteroids.splice(aIndex, 1);
                this.sounds.explosion.play();

                if (this.spacecraft.health <= 0) {
                    this.gameOver();
                }
            }

            this.projectiles.forEach((projectile, pIndex) => {
                const projectileBB = new THREE.Box3().setFromObject(projectile.mesh);
                if (asteroidBB.intersectsBox(projectileBB)) {
                    this.scene.remove(asteroid.mesh);
                    this.asteroids.splice(aIndex, 1);
                    this.scene.remove(projectile.mesh);
                    this.projectiles.splice(pIndex, 1);
                    this.sounds.explosion.play();
                    this.score += Math.floor(100 * this.difficulty * this.scoreMultiplier);
                    this.scoreMultiplier += 0.1;
                    this.ui.updateScore(this.score);
                }
            });
        });

        this.powerUps.forEach((powerUp, index) => {
            const powerUpBB = new THREE.Box3().setFromObject(powerUp.mesh);
            if (spacecraftBB.intersectsBox(powerUpBB)) {
                this.spacecraft.applyPowerUp(powerUp.type);
                this.ui.updateHealth(this.spacecraft.health);
                this.ui.updateShield(this.spacecraft.shield);
                this.scene.remove(powerUp.mesh);
                this.powerUps.splice(index, 1);
                this.sounds.powerUp.play();
            }
        });
    }

    updateScore(delta) {
        const currentTime = Date.now();
        const timeDiff = (currentTime - this.lastScoreUpdate) / 1000; // Convert to seconds
        this.score += Math.floor(timeDiff * this.scoreMultiplier * this.difficulty);
        this.lastScoreUpdate = currentTime;

        this.ui.updateScore(this.score);

        // Decrease score multiplier over time
        this.scoreMultiplier = Math.max(1, this.scoreMultiplier - delta * 0.1);
    }

    gameOver() {
        this.gameActive = false;
        this.sounds.background.stop();
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('final-score').textContent = this.score;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    shoot() {
        if (this.spacecraft.canShoot()) {
            const projectilePositions = this.spacecraft.getProjectilePosition();
            projectilePositions.forEach(position => {
                const projectile = new Projectile(this.scene, position);
                this.projectiles.push(projectile);
            });
            this.sounds.shoot.play();
            this.spacecraft.heat();
            this.ui.updateWeaponHeat(this.spacecraft.weaponHeat);
        }
    }

    getScore() {
        return this.score;
    }
}