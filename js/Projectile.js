class Projectile {
    constructor(scene, startPosition) {
        this.scene = scene;
        this.createProjectile(startPosition);
    }

    createProjectile(startPosition) {
        const geometry = new THREE.SphereGeometry(0.05, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(startPosition);
        this.scene.add(this.mesh);

        this.light = new THREE.PointLight(0xffff00, 1, 2);
        this.mesh.add(this.light);

        this.velocity = new THREE.Vector3(0, 0, -20);
    }

    update(delta) {
        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
    }

    isOutOfBounds() {
        return this.mesh.position.z < -20;
    }
}