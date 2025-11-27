const canvas = document.getElementById("labCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 520;

let lastTime = 0;
let running = true;
let currentScene = "sea";
let alloysScene = null;

// Shared helpers
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// Color helpers: simple hex <-> rgb and lerp
function hexToRgb(hex) {
  const h = hex.replace('#','');
  const bigint = parseInt(h, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function rgbToHex(r,g,b) {
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}

function lerpColor(aHex, bHex, t) {
  const a = hexToRgb(aHex);
  const b = hexToRgb(bHex);
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  return rgbToHex(r,g,bl);
}

function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// -------------------- Scene 1: Metallic bonding --------------------
class SeaScene {
  constructor() {
    this.ions = [];
    this.electrons = [];
    this.time = 0;
    this.heatFront = 0;
    this.heating = false;
    this.init();
  }

  init() {
    this.ions = [];
    this.electrons = [];
    this.heatFront = 0;
    this.heating = false;
    const cols = 9;
    const rows = 5;
    const startX = 110;
    const startY = 120;
    const gapX = 70;
    const gapY = 65;

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        this.ions.push({
          x: startX + i * gapX,
          y: startY + j * gapY,
        });
      }
    }

    const area = {
      x: 80,
      y: 90,
      w: canvas.width - 160,
      h: canvas.height - 180,
    };

    for (let i = 0; i < 80; i++) {
      this.electrons.push({
        x: area.x + Math.random() * area.w,
        y: area.y + Math.random() * area.h,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
      });
    }
  }

  reset() {
    this.init();
  }

  update(dt) {
    this.time += dt;

    const area = {
      x: 80,
      y: 90,
      w: canvas.width - 160,
      h: canvas.height - 180,
    };

    // Advance heat front if active (from left to right)
    if (thermalActive) {
      this.heating = true;
      this.heatFront = Math.min(
        area.x + area.w,
        this.heatFront + dt * 220
      );
    } else if (this.heating) {
      // Cool down slowly when toggled off
      this.heatFront = Math.max(area.x, this.heatFront - dt * 180);
      if (this.heatFront <= area.x + 2) {
        this.heating = false;
      }
    }

    for (const e of this.electrons) {
      const isHot = this.heating && e.x < this.heatFront;
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      if (e.x < area.x || e.x > area.x + area.w) {
        e.vx *= -1;
      }
      if (e.y < area.y || e.y > area.y + area.h) {
        e.vy *= -1;
      }

      const baseJitter = isHot ? 0.08 : 0.03;
      const kick = isHot ? 45 : 25;
      if (Math.random() < baseJitter) {
        e.vx += (Math.random() - 0.5) * kick;
        e.vy += (Math.random() - 0.5) * kick;
      }

      const maxSpeed = isHot ? 110 : 60;
      e.vx = clamp(e.vx, -maxSpeed, maxSpeed);
      e.vy = clamp(e.vy, -maxSpeed, maxSpeed);
    }
  }

  drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#020617");
    grad.addColorStop(1, "#020617");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.75)";
    ctx.lineWidth = 2;
    const pad = 70;
    ctx.strokeRect(pad, pad, canvas.width - pad * 2, canvas.height - pad * 2);
  }

  drawIons() {
    for (const ion of this.ions) {
      const rOuter = 16;
      const rInner = 10;

      const isHot = this.heating && ion.x < this.heatFront;

      // Small vibration around the lattice point, larger when hot
      const baseJiggle = 0.6;
      const hotExtra = 2.0;
      const amp = isHot ? baseJiggle + hotExtra : baseJiggle;
      const t = this.time * (isHot ? 18 : 10) + ion.x * 0.03 + ion.y * 0.02;
      const jx = Math.sin(t) * amp;
      const jy = Math.cos(t * 1.1) * amp;
      const cx = ion.x + jx;
      const cy = ion.y + jy;

      const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, rOuter);
      if (isHot) {
        glow.addColorStop(0, "rgba(253, 224, 171, 1)");
        glow.addColorStop(1, "rgba(248, 113, 113, 0.08)");
      } else {
        glow.addColorStop(0, "rgba(248, 250, 252, 0.9)");
        glow.addColorStop(1, "rgba(148, 163, 184, 0.05)");
      }

      ctx.beginPath();
      ctx.fillStyle = glow;
      ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
      ctx.fill();

      const core = ctx.createLinearGradient(
        cx - rInner,
        cy - rInner,
        cx + rInner,
        cy + rInner
      );
      if (isHot) {
        core.addColorStop(0, "#fed7aa");
        core.addColorStop(1, "#f97316");
      } else {
        core.addColorStop(0, "#e5e7eb");
        core.addColorStop(1, "#9ca3af");
      }

      ctx.beginPath();
      ctx.fillStyle = core;
      ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.font = "12px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", cx, cy + 1);
    }
  }

  drawElectrons() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const e of this.electrons) {
      const r = 4;
      const isHot = this.heating && e.x < this.heatFront;

      const glow = ctx.createRadialGradient(e.x, e.y, 0.5, e.x, e.y, r * 2.3);
      if (isHot) {
        glow.addColorStop(0, "rgba(248, 250, 252, 1)");
        glow.addColorStop(0.5, "rgba(251, 146, 60, 0.9)");
        glow.addColorStop(1, "rgba(127, 29, 29, 0)");
      } else {
        glow.addColorStop(0, "rgba(56, 189, 248, 0.95)");
        glow.addColorStop(0.6, "rgba(8, 47, 73, 0.5)");
        glow.addColorStop(1, "rgba(8, 47, 73, 0)");
      }

      ctx.beginPath();
      ctx.fillStyle = glow;
      ctx.arc(e.x, e.y, r * 2.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = isHot ? "#fff7ed" : "#e0f2fe";
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawOverlay() {
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(24, 22, 260, 70);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.8)";
    ctx.lineWidth = 1;
    ctx.strokeRect(24, 22, 260, 70);

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "14px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("Delocalised electrons", 38, 40);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "12px system-ui";
    ctx.fillText("move freely through the giant", 38, 58);
    ctx.fillText("lattice of positive metal ions.", 38, 72);

    if (this.heating) {
      ctx.fillStyle = "#fed7aa";
      ctx.font = "11px system-ui";
      ctx.fillText("Heating: faster electrons bump ions and", 38, 88);
      ctx.fillText("transfer energy along the metal.", 38, 100);
    }
  }

  draw() {
    this.drawBackground();
    this.drawIons();
    this.drawElectrons();
    this.drawOverlay();
  }
}

// -------------------- Scene 4: Alloys & steel --------------------
class AlloysScene {
  constructor() {
    this.time = 0;
    this.carbonPercent = 0.2; // 0.2% typical mild steel
    this.folds = 1;
    this.lattice = [];
    this.carbonAtoms = [];
    this.fragments = []; // shards for non-alloy sword when it shatters
    this.swords = {
      angleLeft: -25,
      angleRight: 25,
      impactProgress: 0,
      impacting: false,
      effectiveShear: 0,
      didShatter: false,
    };
    // layout settings: keep lattice in upper area and swords lower to avoid overlap
    this.cols = 10;
    this.rows = 4; // fewer rows so lattice fits in upper region
    this.startX = 150;
    this.startY = 80;
    this.gapX = 55;
    this.gapY = 45;
    this.swordY = 360; // draw swords lower in the canvas
    this.initLattice();
    this.updateCarbonAtoms();
  }

  initLattice() {
    this.lattice = [];
    this.lattice = [];
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        this.lattice.push({
          x: this.startX + i * this.gapX,
          y: this.startY + j * this.gapY,
          row: j,
          col: i,
        });
      }
    }
  }

  updateCarbonAtoms() {
    this.carbonAtoms = [];
    const interstitialSites = [];
    // interstitial sites exist between 4 neighbouring ions: iterate rows-1 and cols-1
    for (let j = 0; j < this.rows - 1; j++) {
      for (let i = 0; i < this.cols - 1; i++) {
        const baseIndex = j * this.cols + i;
        const ionA = this.lattice[baseIndex];
        const ionB = this.lattice[baseIndex + 1];
        const ionC = this.lattice[baseIndex + this.cols];
        const ionD = this.lattice[baseIndex + this.cols + 1];
        if (!ionA || !ionB || !ionC || !ionD) continue;
        interstitialSites.push({
          x: (ionA.x + ionB.x + ionC.x + ionD.x) / 4,
          y: (ionA.y + ionB.y + ionC.y + ionD.y) / 4,
        });
      }
    }
    const maxCarbonAtoms = Math.floor(
      interstitialSites.length * clamp(this.carbonPercent / 2.0, 0, 1)
    );

    // Randomly choose interstitial sites to place carbon atoms using Fisher-Yates shuffle
    if (interstitialSites.length > 0 && maxCarbonAtoms > 0) {
      for (let i = interstitialSites.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = interstitialSites[i];
        interstitialSites[i] = interstitialSites[j];
        interstitialSites[j] = tmp;
      }

      const pick = Math.min(maxCarbonAtoms, interstitialSites.length);
      for (let k = 0; k < pick; k++) {
        const site = interstitialSites[k];
        this.carbonAtoms.push({ x: site.x, y: site.y });
      }
    }
  }

  setCarbonPercent(p) {
    this.carbonPercent = clamp(p, 0, 2.0);
    this.updateCarbonAtoms();
  }

  setFolds(n) {
    this.folds = clamp(n, 1, 12);
  }

  triggerImpact() {
    if (!this.swords.impacting) {
      this.swords.impacting = true;
      this.swords.impactProgress = 0;
      const baseShear = 0.4 + this.carbonPercent * 0.4;
      const foldBoost = 1 + (this.folds - 1) * 0.04;
      const disruption = this.carbonPercent; // more carbon -> more disruption
      this.swords.effectiveShear = clamp(
        baseShear * foldBoost * (1 - disruption * 0.15),
        0.3,
        1.4
      );
      // Reset shatter flag; actual fragments spawn slightly later when blades collide
      this.swords.didShatter = false;
    }
  }

  reset() {
    this.time = 0;
    this.swords.impacting = false;
    this.swords.impactProgress = 0;
    this.initLattice();
    this.updateCarbonAtoms();
  }

  update(dt) {
    this.time += dt;

    if (this.swords.impacting) {
      this.swords.impactProgress += dt * 1.8;
      if (this.swords.impactProgress >= 1) {
        this.swords.impactProgress = 1;
        this.swords.impacting = false;
        setTimeout(() => {
          this.swords.impactProgress = 0;
        }, 350);
      }
    }

    // Spawn fragments slightly after blades have crossed to make the collision feel realistic
    const shatterAt = 0.65; // when to spawn shards (0..1)
    if (this.swords.impactProgress >= shatterAt && !this.swords.didShatter) {
      this.createFragments();
      this.swords.didShatter = true;
    }

    // Update fragments (shards) physics
    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const f = this.fragments[i];
      f.vy += 280 * dt; // gravity
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.angle += f.av * dt;
      f.life -= dt;
      if (f.life <= 0) this.fragments.splice(i, 1);
    }
  }

  createFragments() {
    // Create small fragments at centre where swords meet
    const centerX = canvas.width / 2;
    const centerY = this.swordY + 60; // spawn at handle-top pivot
    const count = 16;
    for (let i = 0; i < count; i++) {
      const sx = centerX + (Math.random() - 0.5) * 40;
      const sy = centerY + (Math.random() - 0.5) * 10;
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 180;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 60;
      const w = 6 + Math.random() * 18;
      const h = 4 + Math.random() * 10;
      this.fragments.push({ x: sx, y: sy, vx, vy, w, h, angle: Math.random()*360, av: (Math.random()-0.5)*360, life: 1.2 });
    }
  }

  drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#020617");
    grad.addColorStop(1, "#020617");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw a subtle separator between lattice (top) and swords (lower)
    const latticeBottom = this.startY + (this.rows - 1) * this.gapY;
    const sepY = latticeBottom + 20;
    ctx.fillStyle = "rgba(15,23,42,0.9)";
    ctx.fillRect(80, sepY, canvas.width - 160, 10);
  }

  drawLattice() {
    for (const ion of this.lattice) {
      const offset = Math.sin(this.time * 6 + ion.x * 0.03) * 1.2;
      // base position with small thermal jiggle
      const baseCx = ion.x + offset * (this.carbonPercent + 0.2);
      const baseCy = ion.y;

      // displacement from nearby carbon dopants to show lattice distortion
      let dispX = 0;
      let dispY = 0;
      const influenceRadius = 48; // px
      for (const c of this.carbonAtoms) {
        const dx = baseCx - c.x;
        const dy = baseCy - c.y;
        const dist = Math.hypot(dx, dy) + 0.0001;
        if (dist < influenceRadius) {
          // stronger carbon % -> stronger local distortion
          const influence = Math.pow(1 - dist / influenceRadius, 1.6) * (0.6 + this.carbonPercent * 0.9);
          // push ions slightly away from the carbon atom (creates local buckling)
          dispX += (dx / dist) * influence * 10;
          dispY += (dy / dist) * influence * 6;
        }
      }

      const cx = baseCx + dispX;
      const cy = baseCy + dispY;
      const r = 10;

      const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, r + 4);
      grad.addColorStop(0, "#e5e7eb");
      grad.addColorStop(1, "rgba(148,163,184,0.15)");
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = "#cbd5f5";
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#020617";
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Fe²⁺", cx, cy + 1);
    }

    for (const c of this.carbonAtoms) {
      const jiggle = Math.sin(this.time * 9 + c.x * 0.04) * 1.4;
      const cx = c.x + jiggle;
      const cy = c.y;
      // larger carbon markers to emphasise interstitial dopants
      const r = 8 + Math.round(this.carbonPercent * 1.8);
      const glowSize = r + 3;
      const grad = ctx.createRadialGradient(cx, cy, 0.5, cx, cy, glowSize * 1.2);
      grad.addColorStop(0, "#ffb347");
      grad.addColorStop(0.4, "#f97316");
      grad.addColorStop(1, "rgba(248, 171, 77, 0.06)");
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(cx, cy, glowSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = "#fdba74";
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#172554";
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("C", cx, cy + 0.5);
    }
  }

  drawSwords() {
    const centerX = canvas.width / 2;
    const centerY = this.swordY;
    const impact = this.swords.impactProgress;
    // move swords closer as impact progresses: lerp from baseOffset -> finalOffset
    const base = this.swords.baseOffset || 40;
    const finalOffset = 8; // small separation when crossed
    const impactOffset = lerp(base, finalOffset, impact);

    // Left sword: alloyed — colour varies with carbon content
    const tcol = clamp(this.carbonPercent / 2.0, 0, 1);
    const bladeCol = lerpColor('#e5e7eb', '#b45309', tcol);

    // rotation from vertical (0) to crossed based on impact progress
    // swapped directions: left rotates to +35deg (clockwise), right to -35deg (anticlockwise)
    const leftRot = (lerp(0, 35, impact) * Math.PI) / 180;
    const rightRot = (lerp(0, -35, impact) * Math.PI) / 180;

    ctx.save();
    // translate to the handle-top pivot (handle top is at local y = 10, previous translate used +20)
    ctx.translate(centerX - impactOffset, centerY + 30);
    ctx.rotate(leftRot);
    this.drawSwordShape(bladeCol, '#7c2d12', 1);
    ctx.restore();

    // Right sword: pure (non-alloy) — will shatter on impact
    ctx.save();
    ctx.translate(centerX + impactOffset, centerY + 30);
    ctx.rotate(rightRot);
    ctx.scale(-1, 1);
    const intactAlpha = this.fragments.length ? 0.25 : 1.0;
    this.drawSwordShape('#e5e7eb', '#7c2d12', intactAlpha);
    ctx.restore();

    // Draw fragments (shards) from non-alloy sword
    if (this.fragments.length) {
      for (const f of this.fragments) {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate((f.angle * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, f.life / 1.2);
        ctx.fillStyle = '#d1d5db';
        ctx.fillRect(-f.w/2, -f.h/2, f.w, f.h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    const shear = this.swords.effectiveShear || 0.5;
    const barWidth = 120;
    const barHeight = 8;
    // Position the shear bar to the left of the left sword to avoid overlap
    const leftSwordX = centerX - impactOffset;
    const margin = 12;
    let x = Math.max(20, Math.round(leftSwordX - margin - barWidth));
    const y = Math.round(centerY - 60);

    ctx.fillStyle = "rgba(15,23,42,0.9)";
    ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
    const grad = ctx.createLinearGradient(x, y, x + barWidth, y);
    grad.addColorStop(0, "#fecaca");
    grad.addColorStop(clamp(shear / 1.4, 0, 1), "#f97316");
    grad.addColorStop(1, "#4ade80");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barWidth * clamp(shear / 1.4, 0.1, 1), barHeight);

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "12px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("Shear strength", x, y - 10);
  }

  drawSwordShape(bladeColor = '#e5e7eb', handleColor = '#9a3412', alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(-10, 10);
    ctx.lineTo(10, 10);
    ctx.lineTo(14, -80);
    ctx.lineTo(0, -120);
    ctx.lineTo(-14, -80);
    ctx.closePath();
    const mid = lerpColor(bladeColor, '#ffffff', 0.35);
    const bladeGrad = ctx.createLinearGradient(-20, -120, 20, 10);
    bladeGrad.addColorStop(0, bladeColor);
    bladeGrad.addColorStop(0.45, mid);
    bladeGrad.addColorStop(1, '#f9fafb');
    ctx.fillStyle = bladeGrad;
    ctx.fill();

    ctx.fillStyle = handleColor;
    ctx.fillRect(-18, 10, 36, 6);
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(-4, 16, 8, 20);
    ctx.restore();
  }

  drawOverlay() {
    ctx.fillStyle = "rgba(15,23,42,0.9)";
    ctx.fillRect(canvas.width - 280, 22, 250, 90);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.8)";
    ctx.lineWidth = 1;
    ctx.strokeRect(canvas.width - 280, 22, 250, 90);

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "14px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("Alloy: iron + carbon", canvas.width - 266, 40);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "12px system-ui";
    ctx.fillText("Carbon atoms fit into gaps in", canvas.width - 266, 58);
    ctx.fillText("the Fe²⁺ lattice and distort it.", canvas.width - 266, 72);
    ctx.fillText("This resists layers sliding → higher", canvas.width - 266, 88);
    ctx.fillText("shear strength but less malleable.", canvas.width - 266, 102);
  }

  draw() {
    this.drawBackground();
    this.drawLattice();
    this.drawSwords();
    this.drawOverlay();
  }
}

// -------------------- Scene 2: Hammering / malleability --------------------
class HammerScene {
  constructor() {
    this.time = 0;
    this.phase = 0;
    this.phaseTime = 0;
    this.flattenAmount = 0;
    this.compactionLevel = 0;
    this.ions = [];
    this.init();
  }

  init() {
    this.time = 0;
    this.phase = 0;
    this.phaseTime = 0;
    this.flattenAmount = 0;
    this.compactionLevel = 0;
    this.ions = [];

    const cols = 10;
    const rows = 6;
    const startX = 140;
    const startY = 170;
    const gapX = 55;
    const gapY = 45;

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const baseX = startX + i * gapX;
        const baseY = startY + j * gapY;
        this.ions.push({
          row: j,
          baseX,
          baseY,
          x: baseX,
          y: baseY,
        });
      }
    }
  }

  reset() {
    this.init();
  }

  update(dt) {
    this.time += dt;
    this.phaseTime += dt;

    if (this.phase === 0 && this.phaseTime > 2.5) {
      this.phase = 1;
      this.phaseTime = 0;
    } else if (this.phase === 1 && this.phaseTime > 1.6) {
      this.phase = 2;
      this.phaseTime = 0;
    } else if (this.phase === 2 && this.phaseTime > 2.0) {
      this.phase = 3;
      this.phaseTime = 0;
    } else if (this.phase === 3 && this.phaseTime > 1.2) {
      this.phase = 0;
      this.phaseTime = 0;
      this.flattenAmount = 0;
    }

    // Build up a lasting flattening of the lattice each time the hammer hits
    if (this.phase === 1) {
      const hitProgress = clamp(this.phaseTime / 1.0, 0, 1);
      const addedFlatten = 0.25 * easeOutBounce(hitProgress);
      this.flattenAmount = clamp(this.flattenAmount + addedFlatten * dt * 2, 0, 1.1);

      // Gradually compact the number of effective layers: deeper hits -> fewer visible rows
      const addedCompaction = 0.18 * easeOutCubic(hitProgress);
      this.compactionLevel = clamp(this.compactionLevel + addedCompaction * dt * 1.6, 0, 1.0);
    }

    // Slowly relax the lattice a little between hits so the motion is readable
    if (this.phase === 0 || this.phase === 3) {
      this.flattenAmount = lerp(this.flattenAmount, 0.15, dt * 0.6);
    }

    for (const ion of this.ions) {
      let offsetX = 0;
      let offsetY = 0;

      const level = (ion.baseY - 170) / 260;

      // Instantaneous squash and sideways shove during the impact itself
      if (this.phase === 1) {
        const impactStrength = Math.max(0, 1 - Math.abs(ion.baseY - 200) / 110);
        const local = easeOutBounce(clamp(this.phaseTime / 0.8, 0, 1));
        offsetY += lerp(0, 10 * impactStrength, local);
        offsetX += lerp(0, -6 * impactStrength, easeOutQuad(this.phaseTime));
      }

      // Persistent flattening: top layers move down, bottom layers move up
      const f = this.flattenAmount;
      if (f > 0) {
        const squash = (level - 0.5); // -0.5 bottom, +0.5 top
        offsetY += -32 * f * squash;
        offsetX += 30 * f * squash;
      }

      // Compaction effect: merge layers together visually by pulling neighbouring rows
      if (this.compactionLevel > 0) {
        const rowCenter = 2.5; // for 6 rows (0..5), centre ~2.5
        const rowOffset = ion.row - rowCenter;
        const pull = -rowOffset * 10 * this.compactionLevel;
        offsetY += pull;

        // Slight horizontal shuffle so rows appear to interlock rather than overlap perfectly
        offsetX += (rowOffset * 4) * this.compactionLevel;
      }

      const jiggle = (Math.sin(this.time * 6 + ion.baseX) * 1.5) / 2;
      ion.x = ion.baseX + offsetX + jiggle;
      ion.y = ion.baseY + offsetY;
    }
  }

  drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#020617");
    grad.addColorStop(1, "#020617");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawAnvil() {
    ctx.save();
    ctx.translate(0, 40);

    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.moveTo(120, 330);
    ctx.lineTo(780, 330);
    ctx.lineTo(740, 380);
    ctx.lineTo(160, 380);
    ctx.closePath();
    ctx.fill();

    const topGrad = ctx.createLinearGradient(0, 300, 0, 350);
    topGrad.addColorStop(0, "#1e293b");
    topGrad.addColorStop(1, "#020617");
    ctx.fillStyle = topGrad;
    ctx.fillRect(110, 300, 700, 40);

    const bodyGrad = ctx.createLinearGradient(0, 340, 0, 420);
    bodyGrad.addColorStop(0, "#020617");
    bodyGrad.addColorStop(1, "#000");
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(200, 340, 520, 80);

    ctx.restore();
  }

  drawHammer() {
    const t = clamp(this.phaseTime, 0, 1.3);
    let hammerY = lerp(-200, 110, easeOutCubic(Math.min(t, 1)));

    if (this.phase === 1 && this.phaseTime > 0.4) {
      const rebound = Math.max(0, 1.2 - (this.phaseTime - 0.4) * 3);
      hammerY -= rebound * 14;
    }

    const swingX = 430 + Math.sin(this.time * 1.2) * 8;

    ctx.save();
    ctx.translate(swingX, hammerY);

    ctx.fillStyle = "#0b1120";
    ctx.fillRect(-10, -10, 20, 140);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-9, -9, 18, 138);

    const headGrad = ctx.createLinearGradient(-70, 0, 70, 0);
    headGrad.addColorStop(0, "#64748b");
    headGrad.addColorStop(0.5, "#cbd5f5");
    headGrad.addColorStop(1, "#4b5563");

    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.roundRect(-70, -30, 140, 40, 10);
    ctx.fill();

    ctx.restore();

    if (this.phase === 1 && this.phaseTime > 0.2 && this.phaseTime < 0.9) {
      const impact = (this.phaseTime - 0.2) / 0.7;
      const alpha = 1 - impact;
      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(430, 180, 60 + i * 10 * impact, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawMetal() {
    // Base geometry for the metal sheet (starts shorter and narrower)
    const canvasMidX = canvas.width / 2;
    const baseTop = 150;
    const baseBottom = 260;
    const baseHalfWidth = (canvas.width - 380) / 2; // narrower than full anvil

    // The visible anvil top is drawn at y ~340 (see drawAnvil translate + topGrad)
    const targetGap = 12; // small visual gap between lattice and anvil
    const anvilTopY = 340;

    // Deformation from hammering: use both flattening and compaction
    const deformation = clamp(this.flattenAmount * 0.9 + this.compactionLevel * 0.7, 0, 1.2);

    // Height reduces with deformation
    const heightShrink = 34 * deformation;
    const height = (baseBottom - baseTop) - heightShrink;

    // Keep the lattice bottom close to the anvil surface
    const bottom = anvilTopY - targetGap;
    const top = bottom - height;

    // Width increases with deformation (metal spreads sideways)
    const widthGrow = 42 * deformation;
    const halfWidth = baseHalfWidth + widthGrow;
    const left = canvasMidX - halfWidth;
    const right = canvasMidX + halfWidth;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(right, top);
    ctx.lineTo(right + 10, bottom);
    ctx.lineTo(left - 10, bottom);
    ctx.closePath();

    const metalGrad = ctx.createLinearGradient(left, top, right, bottom);
    metalGrad.addColorStop(0, "#1f2937");
    metalGrad.addColorStop(0.5, "#4b5563");
    metalGrad.addColorStop(1, "#111827");

    ctx.fillStyle = metalGrad;
    ctx.fill();

    ctx.clip();

    for (const ion of this.ions) {
      const r = 8;
      const glow = ctx.createRadialGradient(
        ion.x,
        ion.y,
        1,
        ion.x,
        ion.y,
        r * 2.2
      );
      glow.addColorStop(0, "rgba(248, 250, 252, 0.9)");
      glow.addColorStop(1, "rgba(148, 163, 184, 0.1)");

      ctx.beginPath();
      ctx.fillStyle = glow;
      ctx.arc(ion.x, ion.y, r * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = "#e5e7eb";
      ctx.arc(ion.x, ion.y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", ion.x, ion.y + 0.5);
    }

    ctx.restore();

    ctx.strokeStyle = "rgba(148, 163, 184, 0.9)";
    ctx.lineWidth = 3;
    const outlineWidth = right - left;
    const outlineHeight = bottom - top;
    ctx.strokeRect(left, top, outlineWidth, outlineHeight);
  }

  drawOverlay() {
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(24, 22, 310, 70);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.8)";
    ctx.lineWidth = 1;
    ctx.strokeRect(24, 22, 310, 70);

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "14px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("Layers of ions", 38, 45);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "12px system-ui";
    ctx.fillText("can slide but the metallic", 38, 64);
    ctx.fillText("bonding holds the lattice together.", 38, 80);
  }

  draw() {
    this.drawBackground();
    this.drawAnvil();
    this.drawMetal();
    this.drawHammer();
    this.drawOverlay();
  }
}

function easeOutBounce(t) {
  t = clamp(t, 0, 1);
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    t -= 1.5 / d1;
    return n1 * t * t + 0.75;
  } else if (t < 2.5 / d1) {
    t -= 2.25 / d1;
    return n1 * t * t + 0.9375;
  } else {
    t -= 2.625 / d1;
    return n1 * t * t + 0.984375;
  }
}

// -------------------- Scene 3: Wire & current --------------------
class WireScene {
  constructor() {
    this.time = 0;
    this.ions = [];
    this.electrons = [];
    this.voltageOn = false;
    this.voltageTime = 0;
    this.init();
  }

  init() {
    this.time = 0;
    this.voltageOn = false;
    this.voltageTime = 0;
    this.ions = [];
    this.electrons = [];

    const wireStartX = 120;
    const wireEndX = canvas.width - 120;
    const centreY = canvas.height / 2 + 10;
    const rows = 3;
    const cols = 11;
    const gapX = (wireEndX - wireStartX) / (cols - 1);
    const gapY = 26;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = wireStartX + c * gapX;
        const y = centreY + (r - 1) * gapY;
        this.ions.push({ x, y });
      }
    }

    const bounds = {
      x: wireStartX + 12,
      y: centreY - 30,
      w: wireEndX - wireStartX - 24,
      h: 60,
    };

    for (let i = 0; i < 70; i++) {
      this.electrons.push({
        x: bounds.x + Math.random() * bounds.w,
        y: bounds.y + Math.random() * bounds.h,
        baseSpeed: 45 + Math.random() * 25,
        offset: Math.random() * Math.PI * 2,
      });
    }
  }

  reset() {
    this.init();
  }

  toggleVoltage() {
    this.voltageOn = !this.voltageOn;
    this.voltageTime = 0;
  }

  update(dt) {
    this.time += dt;
    if (this.voltageOn) {
      this.voltageTime += dt;
    }

    const wireStartX = 120;
    const wireEndX = canvas.width - 120;
    const bounds = {
      x: wireStartX + 12,
      y: canvas.height / 2 + 10 - 30,
      w: wireEndX - wireStartX - 24,
      h: 60,
    };

    for (const e of this.electrons) {
      const driftFactor = this.voltageOn
        ? clamp(this.voltageTime / 1.5, 0.15, 1)
        : 0.12;
      const dir = this.voltageOn ? 1 : 0;

      const randomMotionX = Math.cos(this.time * 4 + e.offset) * 28;
      const randomMotionY = Math.sin(this.time * 5 + e.offset) * 18;

      e.x += (e.baseSpeed * driftFactor * dir + randomMotionX) * dt;
      e.y += randomMotionY * dt;

      if (e.x > bounds.x + bounds.w) {
        e.x = bounds.x;
      } else if (e.x < bounds.x) {
        e.x = bounds.x + bounds.w;
      }

      if (e.y < bounds.y) e.y = bounds.y + bounds.h;
      if (e.y > bounds.y + bounds.h) e.y = bounds.y;
    }
  }

  drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#020617");
    grad.addColorStop(1, "#020617");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawWire() {
    const wireStartX = 120;
    const wireEndX = canvas.width - 120;
    const centreY = canvas.height / 2 + 10;

    const outerGrad = ctx.createLinearGradient(wireStartX, 0, wireEndX, 0);
    outerGrad.addColorStop(0, "#0f172a");
    outerGrad.addColorStop(0.5, "#4b5563");
    outerGrad.addColorStop(1, "#020617");

    ctx.lineWidth = 30;
    ctx.lineCap = "round";
    ctx.strokeStyle = outerGrad;
    ctx.beginPath();
    ctx.moveTo(wireStartX, centreY);
    ctx.lineTo(wireEndX, centreY);
    ctx.stroke();

    const innerGrad = ctx.createLinearGradient(wireStartX, 0, wireEndX, 0);
    innerGrad.addColorStop(0, "#111827");
    innerGrad.addColorStop(0.5, "#6b7280");
    innerGrad.addColorStop(1, "#0b1120");

    ctx.lineWidth = 18;
    ctx.strokeStyle = innerGrad;
    ctx.beginPath();
    ctx.moveTo(wireStartX, centreY);
    ctx.lineTo(wireEndX, centreY);
    ctx.stroke();
  }

  drawIons() {
    for (const ion of this.ions) {
      const r = 6;
      const glow = ctx.createRadialGradient(
        ion.x,
        ion.y,
        1,
        ion.x,
        ion.y,
        r * 2
      );
      glow.addColorStop(0, "rgba(248, 250, 252, 0.9)");
      glow.addColorStop(1, "rgba(148, 163, 184, 0.15)");

      ctx.beginPath();
      ctx.fillStyle = glow;
      ctx.arc(ion.x, ion.y, r * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = "#e5e7eb";
      ctx.arc(ion.x, ion.y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#111827";
      ctx.font = "9px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", ion.x, ion.y + 0.5);
    }
  }

  drawElectrons() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const e of this.electrons) {
      const r = 4;
      const glow = ctx.createRadialGradient(e.x, e.y, 0.5, e.x, e.y, r * 2.4);
      glow.addColorStop(0, this.voltageOn ? "#facc15" : "#38bdf8");
      glow.addColorStop(0.7, this.voltageOn ? "rgba(202, 138, 4, 0.45)" : "rgba(8, 47, 73, 0.5)");
      glow.addColorStop(1, "rgba(8, 47, 73, 0)");

      ctx.beginPath();
      ctx.fillStyle = glow;
      ctx.arc(e.x, e.y, r * 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = "#f9fafb";
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawBattery() {
    const centreY = canvas.height / 2 + 10;
    const leftX = 75;
    const rightX = canvas.width - 75;

    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(leftX + 25, centreY);
    ctx.lineTo(115, centreY);
    ctx.moveTo(canvas.width - 115, centreY);
    ctx.lineTo(rightX - 25, centreY);
    ctx.stroke();
    ctx.setLineDash([]);

    function drawCell(x, polarity) {
      const grad = ctx.createLinearGradient(x - 20, 0, x + 20, 0);
      grad.addColorStop(0, "#020617");
      grad.addColorStop(0.5, "#16a34a");
      grad.addColorStop(1, "#020617");

      ctx.fillStyle = grad;
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - 18, centreY - 22, 36, 44, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#bbf7d0";
      ctx.font = "13px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(polarity, x, centreY);
    }

    drawCell(leftX, "+");
    drawCell(rightX, "–");

    if (this.voltageOn) {
      const arrows = 8;
      const startX = 120;
      const endX = canvas.width - 120;
      const span = endX - startX;

      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2;
      for (let i = 0; i < arrows; i++) {
        const t = ((this.time * 0.8 + i / arrows) % 1) * span;
        const x = startX + t;
        const y = centreY - 26;
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x + 8, y);
        ctx.lineTo(x + 2, y - 5);
        ctx.moveTo(x + 8, y);
        ctx.lineTo(x + 2, y + 5);
        ctx.stroke();
      }
    }
  }

  drawOverlay() {
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.fillRect(24, 22, 340, 70);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.85)";
    ctx.lineWidth = 1;
    ctx.strokeRect(24, 22, 340, 70);

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "14px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("With a potential difference", 38, 45);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "12px system-ui";
    ctx.fillText("delocalised electrons drift, forming an", 38, 64);
    ctx.fillText("electric current through the metal.", 38, 80);
  }

  draw() {
    this.drawBackground();
    this.drawWire();
    this.drawIons();
    this.drawElectrons();
    this.drawBattery();
    this.drawOverlay();
  }
}

// -------------------- Scene management --------------------
const scenes = {
  sea: new SeaScene(),
  hammer: new HammerScene(),
  wire: new WireScene(),
  alloys: null,
};

const sceneInfo = {
  sea: {
    title: "Metallic bonding: sea of electrons",
    body: [
      "Positive metal ions are arranged in a giant lattice.",
      "Outer electrons become delocalised and can move freely.",
      "The strong electrostatic attraction between ions and electrons is the metallic bond.",
    ],
    bullets: [
      "Ions are fixed in position in the lattice.",
      "Electrons move randomly in all directions.",
      'This explains high electrical and <button type="button" id="thermalBtn" class="inline-hot">thermal</button> conductivity.',
    ],
  },
  hammer: {
    title: "Hammering metals: malleability",
    body: [
      "When a metal is hit, layers of ions can slide.",
      "Delocalised electrons are still present between ions.",
      "The metallic bonds re-form and hold the new shape together.",
    ],
    bullets: [
      "Metals are malleable – they can be hammered into sheets.",
      "No like-charged layers line up, so the metal does not shatter.",
      "The sea of electrons acts like a glue between ions.",
    ],
  },
  wire: {
    title: "Drawing wires and making a current",
    body: [
      "A metal can be drawn into a wire because layers of ions slide.",
      "Delocalised electrons are still present in the wire.",
      "When a potential difference is applied, these electrons drift.",
    ],
    bullets: [
      "Electrons drift slowly from negative to positive terminal.",
      "Their movement forms an electric current.",
      "Ions stay fixed in position and do not flow.",
    ],
  },
  alloys: {
    title: "Alloys: carbon in an iron lattice",
    body: [
      "Pure iron has layers of Fe²⁺ ions in a regular giant metallic lattice.",
      "Adding small amounts of carbon forms steel – an alloy.",
      "Carbon atoms sit between the iron ions and distort the lattice.",
    ],
    bullets: [
      "More carbon → harder and stronger steel but less malleable.",
      "Carbon atoms make it harder for layers to slide.",
      "Folding and working the metal can spread impurities and toughen it.",
    ],
  },
};

const sceneTextEl = document.getElementById("sceneText");

// Heat / thermal conduction state for scene 1
let thermalActive = false;
const playPauseBtn = document.getElementById("playPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const navButtons = document.querySelectorAll(".nav-button");
const quizContainer = document.getElementById("quizContainer");
const checkAnswersBtn = document.getElementById("checkAnswersBtn");
const quizFeedback = document.getElementById("quizFeedback");
const alloyControlsEl = document.getElementById("alloyControls");

function renderAlloyControls() {
  if (!alloyControlsEl) return;
  alloyControlsEl.innerHTML = `
    <h3>Steel composition</h3>
    <label>
      Carbon content
      <span class="value" id="carbonValue">0.2% C</span>
    </label>
    <input type="range" id="carbonSlider" min="0" max="2" step="0.1" value="0.2" />
    <label>
      Folds / working
      <span class="value" id="foldsValue">1× folded</span>
    </label>
    <input type="range" id="foldsSlider" min="1" max="12" step="1" value="1" />
  `;

  const carbonSlider = document.getElementById("carbonSlider");
  const foldsSlider = document.getElementById("foldsSlider");
  const carbonValue = document.getElementById("carbonValue");
  const foldsValue = document.getElementById("foldsValue");

  const updateCarbonLabel = (val) => {
    carbonValue.textContent = `${parseFloat(val).toFixed(1)}% C`;
  };

  const updateFoldsLabel = (val) => {
    const n = parseInt(val, 10) || 1;
    foldsValue.textContent = `${n}× folded`;
  };

  if (carbonSlider) {
    updateCarbonLabel(carbonSlider.value);
    carbonSlider.addEventListener("input", () => {
      updateCarbonLabel(carbonSlider.value);
      if (scenes.alloys) {
        scenes.alloys.setCarbonPercent(parseFloat(carbonSlider.value));
      }
    });
  }

  if (foldsSlider) {
    updateFoldsLabel(foldsSlider.value);
    foldsSlider.addEventListener("input", () => {
      updateFoldsLabel(foldsSlider.value);
      if (scenes.alloys) {
        scenes.alloys.setFolds(parseInt(foldsSlider.value, 10));
      }
    });
  }
}

const quizzes = {
  sea: [
    {
      id: "sea-q1",
      question: "What is meant by a 'sea of electrons' in a metal?",
      options: [
        "Electrons are fixed in place around each ion.",
        "Electrons are delocalised and free to move between ions.",
        "Electrons constantly move in and out of the metal.",
      ],
      correct: 1,
    },
    {
      id: "sea-q2",
      question: "Which particles form the lattice in a metal?",
      options: [
        "Neutral metal atoms.",
        "Positive metal ions.",
        "Negative metal ions.",
      ],
      correct: 1,
    },
    {
      id: "sea-q3",
      question: "Why do metals conduct electricity well?",
      options: [
        "Because ions can flow through the lattice.",
        "Because delocalised electrons can move and carry charge.",
        "Because the metal expands when heated.",
      ],
      correct: 1,
    },
  ],
  hammer: [
    {
      id: "hammer-q1",
      question: "Which word describes metals being hammered into shape?",
      options: ["Brittle", "Malleable", "Volatile"],
      correct: 1,
    },
    {
      id: "hammer-q2",
      question: "What happens to the ions when a metal is hammered?",
      options: [
        "They break away completely.",
        "They slide over each other into new positions.",
        "They stay rigid and cannot move at all.",
      ],
      correct: 1,
    },
    {
      id: "hammer-q3",
      question: "Why does the metal not shatter when layers slide?",
      options: [
        "Because like charges line up and repel.",
        "Because metallic bonds break permanently.",
        "Because delocalised electrons keep holding ions together.",
      ],
      correct: 2,
    },
  ],
  wire: [
    {
      id: "wire-q1",
      question: "In a metal wire, which particles move to make a current?",
      options: ["Positive ions", "Delocalised electrons", "Protons"],
      correct: 1,
    },
    {
      id: "wire-q2",
      question: "What provides the push that makes electrons drift?",
      options: [
        "The temperature of the room.",
        "A potential difference (voltage) across the wire.",
        "The mass of the metal ions.",
      ],
      correct: 1,
    },
    {
      id: "wire-q3",
      question: "What do the metal ions do when current flows?",
      options: [
        "They vibrate but stay in fixed positions.",
        "They flow along the wire.",
        "They change into neutral atoms.",
      ],
      correct: 0,
    },
  ],
  alloys: [
    {
      id: "alloys-q1",
      question: "What does carbon do in steel?",
      options: [
        "It replaces iron ions in the lattice.",
        "It sits between iron ions and distorts the lattice.",
        "It removes the sea of electrons.",
      ],
      correct: 1,
    },
    {
      id: "alloys-q2",
      question: "Why is high-carbon steel harder but less malleable?",
      options: [
        "Layers of ions slide past each other more easily.",
        "There are fewer electrons to carry charge.",
        "Carbon atoms block the movement of the layers.",
      ],
      correct: 2,
    },
  ],
};

function renderSceneText(key) {
  const info = sceneInfo[key];
  if (!info) return;
  sceneTextEl.innerHTML = `
    <h2>${info.title}</h2>
    ${info.body.map((p) => `<p>${p}</p>`).join("")}
    <ul>
      ${info.bullets.map((b) => `<li>${b}</li>`).join("")}
    </ul>
    ${
      key === "wire"
        ? '<button id="toggleVoltageBtn" class="secondary-btn"><span class="icon">⚡</span><span>Toggle potential difference</span></button>'
        : ""
    }
    ${
      key === "alloys"
        ? '<button id="impactBtn" class="secondary-btn"><span class="icon">⚔️</span><span>Test shear strength</span></button>'
        : ""
    }
  `;

  if (key === "sea") {
    const thermalBtn = document.getElementById("thermalBtn");
    if (thermalBtn) {
      thermalBtn.addEventListener("click", () => {
        thermalActive = !thermalActive;
      });
    }
  }

  if (key === "wire") {
    const btn = document.getElementById("toggleVoltageBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        scenes.wire.toggleVoltage();
        btn.classList.toggle("on", scenes.wire.voltageOn);
      });
      btn.classList.toggle("on", scenes.wire.voltageOn);
    }
  }

  if (key === "alloys") {
    const btn = document.getElementById("impactBtn");
    if (btn && scenes.alloys) {
      btn.addEventListener("click", () => {
        scenes.alloys.triggerImpact();
      });
    }
  }
}

function renderQuiz(key) {
  const questions = quizzes[key] || [];
  quizContainer.innerHTML = questions
    .map((q, qi) => {
      const optionsHtml = q.options
        .map(
          (opt, oi) => `
        <li>
          <label>
            <input type="radio" name="${q.id}" value="${oi}" />
            <span>${opt}</span>
          </label>
        </li>`
        )
        .join("");

      return `
      <article class="quiz-question">
        <h3>Q${qi + 1}. ${q.question}</h3>
        <ul class="quiz-options">
          ${optionsHtml}
        </ul>
      </article>`;
    })
    .join("");

  quizFeedback.textContent = "";
  quizFeedback.classList.remove("good", "bad");
}

if (checkAnswersBtn) {
  checkAnswersBtn.addEventListener("click", () => {
    const questions = quizzes[currentScene] || [];
    if (!questions.length) return;

    let correctCount = 0;
    let answeredCount = 0;

    questions.forEach((q) => {
      const selected = document.querySelector(
        `input[name="${q.id}"]:checked`
      );
      if (selected) {
        answeredCount += 1;
        const value = parseInt(selected.value, 10);
        if (value === q.correct) correctCount += 1;
      }
    });

    if (answeredCount === 0) {
      quizFeedback.textContent = "Choose at least one answer first.";
      quizFeedback.classList.remove("good");
      quizFeedback.classList.add("bad");
      return;
    }

    const total = questions.length;
    if (correctCount === total) {
      quizFeedback.textContent = `Nice work – you got all ${total} correct!`;
      quizFeedback.classList.remove("bad");
      quizFeedback.classList.add("good");
    } else {
      quizFeedback.textContent = `You scored ${correctCount} out of ${total}. Check your answers and try again.`;
      quizFeedback.classList.remove("good");
      quizFeedback.classList.add("bad");
    }
  });
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const sceneKey = btn.dataset.scene;
    if (!sceneKey) return;
    if (sceneKey === "alloys" && !scenes.alloys) {
      scenes.alloys = new AlloysScene();
    }
    if (!scenes[sceneKey]) return;
    currentScene = sceneKey;
    navButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    scenes[sceneKey].reset();
    renderSceneText(sceneKey);
    renderQuiz(sceneKey);

    if (alloyControlsEl) {
      if (sceneKey === "alloys") {
        alloyControlsEl.classList.add("visible");
      } else {
        alloyControlsEl.classList.remove("visible");
      }
    }
  });
});

playPauseBtn.addEventListener("click", () => {
  running = !running;
  playPauseBtn.textContent = running ? "Pause" : "Play";
});

resetBtn.addEventListener("click", () => {
  scenes[currentScene].reset();
});

function animate(timestamp) {
  const dt = (timestamp - lastTime) / 1000 || 0;
  lastTime = timestamp;

  if (running) {
    scenes[currentScene].update(dt);
  }
  scenes[currentScene].draw();

  requestAnimationFrame(animate);
}

renderSceneText(currentScene);
renderQuiz(currentScene);
renderAlloyControls();
requestAnimationFrame(animate);
