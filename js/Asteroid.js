class Asteroid {
    constructor(scene) {
        this.scene = scene;
        this.createAsteroid();
    }

    createAsteroid() {
        const detailLevel = 2;
        const radiusMin = 0.3;
        const radiusMax = 0.8;
        const geometry = new THREE.IcosahedronGeometry(1, detailLevel);
        
        // Deform the geometry
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const vertex = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
            const radius = Math.random() * (radiusMax - radiusMin) + radiusMin;
            vertex.normalize().multiplyScalar(radius);
            positions[i] = vertex.x;
            positions[i + 1] = vertex.y;
            positions[i + 2] = vertex.z;
        }

        geometry.computeVertexNormals();

        // Create a realistic texture
        const texture = this.createAsteroidTexture();

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            normalMap: this.createNormalMap(texture),
            roughness: 0.8,
            metalness: 0.2,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        this.reset();
    }

    createAsteroidTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Base color
        ctx.fillStyle = `rgb(${Math.random() * 50 + 100}, ${Math.random() * 50 + 100}, ${Math.random() * 50 + 100})`;
        ctx.fillRect(0, 0, 512, 512);

        // Add noise
        for (let i = 0; i < 10000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const radius = Math.random() * 2 + 1;
            const brightness = Math.random() * 50 - 25;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.5)`;
            ctx.fill();
        }

        // Add craters
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const radius = Math.random() * 30 + 10;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        return new THREE.CanvasTexture(canvas);
    }

    createNormalMap(texture) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = texture.image.width;
        canvas.height = texture.image.height;

        ctx.drawImage(texture.image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const avg = (r + g + b) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = 255;
        }

        ctx.putImageData(imageData, 0, 0);
        return new THREE.CanvasTexture(canvas);
    }

    reset() {
        this.mesh.position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 6,
            -20
        );
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            Math.random() * 2 + 3
        );
        this.rotationSpeed = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).multiplyScalar(0.02);
    }

    update(delta) {
        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
        this.mesh.rotation.x += this.rotationSpeed.x * delta;
        this.mesh.rotation.y += this.rotationSpeed.y * delta;
        this.mesh.rotation.z += this.rotationSpeed.z * delta;
    }

    isOutOfBounds() {
        return this.mesh.position.z > 5;
    }
}