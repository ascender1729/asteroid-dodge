class UI {
    constructor() {
        this.scoreElement = document.getElementById('score');
        this.healthElement = document.getElementById('health');
        this.shieldElement = document.getElementById('shield');
        this.weaponHeatElement = document.getElementById('weapon-heat');
        this.reset();
    }

    updateScore(score) {
        this.scoreElement.textContent = `Score: ${score}`;
    }

    updateHealth(health) {
        this.healthElement.textContent = `Health: ${health}%`;
        this.healthElement.style.color = health > 20 ? 'white' : 'red';
    }

    updateShield(shield) {
        this.shieldElement.textContent = `Shield: ${shield}%`;
        this.shieldElement.style.color = shield > 0 ? '#00ffff' : 'white';
    }

    updateWeaponHeat(heat) {
        this.weaponHeatElement.textContent = `Weapon Heat: ${Math.floor(heat)}%`;
        this.weaponHeatElement.style.color = heat < 80 ? 'white' : 'red';
    }

    reset() {
        this.updateScore(0);
        this.updateHealth(100);
        this.updateShield(100);
        this.updateWeaponHeat(0);
    }
}