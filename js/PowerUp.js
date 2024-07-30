class PowerUp {
    constructor(scene) {
        this.scene = scene;
        this.types = ['health', 'shield', 'weapon'];
        this.type = this.types[Math.floor(Math.random() * this.types.length)];
        this.createPowerUp();
    }

    createPowerUp() {
        const geometry = new THREE.OctahedronGeometry(0.3, 0);
        let color;
        switch(this.type) {
            case 'health':
                color = 0xff0000;
                break;
            case 'shield':
                color = 0x00ffff;
                break;
            case 'weapon':
                color = 0xffff00;
                break;
        }
        const material = new THREE.MeshPhongMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            shininess: 100
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        this.light = new THREE.PointLight(color, 1, 3);
        this.mesh.add(this.light);

        this.reset();
    }

    reset() {
        this.mesh.position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 6,
            -20
        );
        this.velocity = new THREE.Vector3(0, 0, 3);
    }

    update(delta) {
        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
        this.mesh.rotation.x += 1 * delta;
        this.mesh.rotation.y += 1 * delta;
        
        // Pulsating effect
        const scale = 1 + 0.1 * Math.sin(Date.now() * 0.005);
        this.mesh.scale.set(scale, scale, scale);
    }

    isOutOfBounds() {
        return this.mesh.position.z > 5;
    }
}