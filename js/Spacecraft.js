class Spacecraft {
    constructor(scene) {
        this.scene = scene;
        this.createSpacecraft();
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.maxSpeed = 5;
        this.friction = 0.99;
        this.health = 100;
        this.shield = 100;
        this.shieldRegenRate = 5; // per second
        this.lastShieldRegenTime = 0;
        this.weaponHeat = 0;
        this.maxWeaponHeat = 100;
        this.weaponCooldownRate = 20; // per second

        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        document.addEventListener('keyup', (event) => this.handleKeyUp(event));
    }

    createSpacecraft() {
        // Main body
        const bodyGeometry = new THREE.ConeGeometry(0.5, 2, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            specular: 0x111111,
            shininess: 30,
            emissive: 0x008888,
            emissiveIntensity: 0.2
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);

        // Cockpit
        const cockpitGeometry = new THREE.SphereGeometry(0.3, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpitMaterial = new THREE.MeshPhongMaterial({
            color: 0x6666ff,
            specular: 0xffffff,
            shininess: 100,
            opacity: 0.7,
            transparent: true
        });
        this.cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        this.cockpit.position.y = 0.5;

        // Wings
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(1, -0.5);
        wingShape.lineTo(1, 0.5);
        wingShape.lineTo(0, 0);
        const wingExtrudeSettings = { depth: 0.05, bevelEnabled: false };
        const wingGeometry = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888,
            specular: 0x222222,
            shininess: 30
        });
        this.leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        this.rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        this.leftWing.position.set(-0.5, -0.3, 0);
        this.rightWing.position.set(0.5, -0.3, 0);
        this.rightWing.rotation.y = Math.PI;

        // Engines
        const engineGeometry = new THREE.CylinderGeometry(0.15, 0.25, 0.5, 16);
        const engineMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            specular: 0x222222,
            shininess: 30
        });
        this.leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        this.rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        this.leftEngine.position.set(-0.3, -1, 0);
        this.rightEngine.position.set(0.3, -1, 0);

        // Engine glow
        this.engineGlow = new THREE.PointLight(0xff6600, 1, 3);
        this.engineGlow.position.set(0, -1.2, 0);

        // Shield
        const shieldGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        const shieldMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        this.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);

        // Weapon mounts
        const weaponGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
        const weaponMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            specular: 0x00ff00,
            shininess: 30,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5
        });
        this.leftWeapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        this.rightWeapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        this.leftWeapon.position.set(-0.5, 0.2, 0.5);
        this.rightWeapon.position.set(0.5, 0.2, 0.5);

        // Assemble spacecraft
        this.mesh = new THREE.Group();
        this.mesh.add(this.body, this.cockpit, this.leftWing, this.rightWing,
                      this.leftEngine, this.rightEngine, this.engineGlow,
                      this.shieldMesh, this.leftWeapon, this.rightWeapon);
        this.mesh.rotation.x = Math.PI / 2;

        this.scene.add(this.mesh);

        // Thruster particles
        this.createThrusterParticles();
    }

    createThrusterParticles() {
        const particleCount = 200;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 0.3;
            positions[i * 3 + 1] = -1.2 - Math.random() * 0.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;

            colors[i * 3] = 1;
            colors[i * 3 + 1] = 0.5 + Math.random() * 0.5;
            colors[i * 3 + 2] = 0;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

        this.thrusterParticles = new THREE.Points(particles, particleMaterial);
        this.mesh.add(this.thrusterParticles);
    }

    update(delta) {
        this.velocity.add(this.acceleration);
        this.velocity.multiplyScalar(this.friction);
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));

        this.acceleration.set(0, 0, 0);

        // Keep spacecraft within bounds
        this.mesh.position.x = Math.max(-5, Math.min(5, this.mesh.position.x));
        this.mesh.position.y = Math.max(-3, Math.min(3, this.mesh.position.y));

        // Add slight rotation for more dynamic movement
        this.mesh.rotation.z = this.velocity.x * 0.2;
        this.mesh.rotation.x = Math.PI / 2 - this.velocity.y * 0.2;

        // Update shield
        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastShieldRegenTime > 1) {
            this.shield = Math.min(100, this.shield + this.shieldRegenRate);
            this.lastShieldRegenTime = currentTime;
        }
        this.shieldMesh.material.opacity = 0.2 * (this.shield / 100);

        // Update weapon heat
        this.weaponHeat = Math.max(0, this.weaponHeat - this.weaponCooldownRate * delta);

        // Update thruster particles
        this.updateThrusterParticles(delta);

        // Animate engine glow
        const glowIntensity = 0.7 + 0.3 * Math.sin(Date.now() * 0.01);
        this.engineGlow.intensity = glowIntensity;
    }

    updateThrusterParticles(delta) {
        const positions = this.thrusterParticles.geometry.attributes.position.array;
        const colors = this.thrusterParticles.geometry.attributes.color.array;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] += (Math.random() - 0.5) * 0.1;
            positions[i + 1] += 0.1 * delta;

            if (positions[i + 1] > -1) {
                positions[i] = (Math.random() - 0.5) * 0.3;
                positions[i + 1] = -1.2 - Math.random() * 0.5;
                positions[i + 2] = (Math.random() - 0.5) * 0.3;

                colors[i] = 1;
                colors[i + 1] = 0.5 + Math.random() * 0.5;
                colors[i + 2] = 0;
            } else {
                colors[i + 1] *= 0.95;
            }
        }

        this.thrusterParticles.geometry.attributes.position.needsUpdate = true;
        this.thrusterParticles.geometry.attributes.color.needsUpdate = true;
    }

    handleKeyDown(event) {
        switch(event.key) {
            case 'ArrowLeft':
            case 'a':
                this.acceleration.x = -1;
                break;
            case 'ArrowRight':
            case 'd':
                this.acceleration.x = 1;
                break;
            case 'ArrowUp':
            case 'w':
                this.acceleration.y = 1;
                break;
            case 'ArrowDown':
            case 's':
                this.acceleration.y = -1;
                break;
        }
    }

    handleKeyUp(event) {
        switch(event.key) {
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'a':
            case 'd':
                this.acceleration.x = 0;
                break;
            case 'ArrowUp':
            case 'ArrowDown':
            case 'w':
            case 's':
                this.acceleration.y = 0;
                break;
        }
    }

    damage(amount) {
        if (this.shield > 0) {
            this.shield = Math.max(0, this.shield - amount);
            amount = Math.max(0, amount - this.shield);
        }
        this.health = Math.max(0, this.health - amount);
        this.body.material.emissive.setHex(0xff0000);
        setTimeout(() => {
            this.body.material.emissive.setHex(0x008888);
        }, 200);
    }

    heal(amount) {
        this.health = Math.min(100, this.health + amount);
    }

    reset() {
        this.mesh.position.set(0, 0, 0);
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
        this.health = 100;
        this.shield = 100;
        this.weaponHeat = 0;
    }

    canShoot() {
        return this.weaponHeat < this.maxWeaponHeat;
    }

    heat() {
        this.weaponHeat += 10;
    }

    getProjectilePosition() {
        const leftPosition = new THREE.Vector3();
        const rightPosition = new THREE.Vector3();
        leftPosition.setFromMatrixPosition(this.leftWeapon.matrixWorld);
        rightPosition.setFromMatrixPosition(this.rightWeapon.matrixWorld);
        return [leftPosition, rightPosition];
    }

    applyPowerUp(type) {
        switch(type) {
            case 'health':
                this.heal(25);
                break;
            case 'shield':
                this.shield = Math.min(100, this.shield + 50);
                break;
            case 'weapon':
                this.weaponHeat = 0;
                break;
        }
    }
}