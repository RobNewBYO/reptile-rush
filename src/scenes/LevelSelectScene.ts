import Phaser from 'phaser';
import { EPISODES } from '../config/episodes';
import { Save } from '../systems/Save';

/** Icon-only level picker. A level unlocks when the one before it is complete. */
export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create() {
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor('#2a6f3b').fadeIn(200);

    let prevDone = true; // first level always open
    EPISODES.forEach((ep, row) => {
      const y = 140 + row * 190;
      const built = ep.levels.length > 0;
      const epUnlocked = built && prevDone;

      this.add.rectangle(width / 2, y, width - 80, 160, 0x000000, 0.25).setStrokeStyle(4, 0xffffff, 0.3);

      // Episode icon: shows the chosen reptile once hatched.
      const icon = ep.id === 2 && Save.species ? (Save.species === 'lizard' ? '🦎' : '🐍') : ep.icon;
      this.add.text(110, y, icon, { fontSize: '84px' }).setOrigin(0.5).setAlpha(built ? 1 : 0.5);

      if (!built) {
        this.add.text(width / 2 + 40, y, '🔒', { fontSize: '64px' }).setOrigin(0.5);
        return;
      }

      ep.levels.forEach((id, i) => {
        const open = epUnlocked && (i === 0 || Save.isComplete(ep.levels[i - 1]));
        const x = 260 + i * 150;
        const btn = this.add
          .circle(x, y - 12, 52, open ? 0xffffff : 0x666666, open ? 0.95 : 0.6)
          .setStrokeStyle(6, open ? 0xffd54f : 0x444444);
        this.add
          .text(x, y - 12, open ? String(i + 1) : '🔒', {
            fontSize: open ? '60px' : '40px',
            color: '#2a6f3b',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);

        const stars = Save.starsFor(id);
        for (let s = 0; s < 3; s++) {
          this.add
            .star(x + (s - 1) * 30, y + 54, 5, 6, 14, s < stars ? 0xffd54f : 0x555555)
            .setAlpha(open ? 1 : 0.4);
        }

        if (open) {
          btn.setInteractive({ useHandCursor: true });
          btn.on('pointerdown', () =>
            this.scene.start('Level', { levelId: id, formId: ep.form }),
          );
        }
      });

      prevDone = ep.levels.every((id) => Save.isComplete(id)) && (ep.id !== 1 || !!Save.species);
    });
  }
}
