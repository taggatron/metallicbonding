const canvas = document.getElementById("labCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 520;

let lastTime = 0;
let running = true;
let currentScene = "sea";

// Shared helpers
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// -------------------- Scene 1: Metallic bonding --------------------
class SeaScene {
  constructor() {
    this.ions = [];
    this.electrons = [];
    this.time = 0;
    this.init();
  }

  init() {
    this.ions = [];
    this.electrons = [];
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

    for (const e of this.electrons) {
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      if (e.x < area.x || e.x > area.x + area.w) {
        e.vx *= -1;
      }
      if (e.y < area.y || e.y > area.y + area.h) {
        e.vy *= -1;
      }

      if (Math.random() < 0.03) {
        e.vx += (Math.random() - 0.5) * 25;
        e.vy += (Math.random() - 0.5) * 25;
      }

      e.vx = clamp(e.vx, -60, 60);
      e.vy = clamp(e.vy, -60, 60);
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

      const glow = ctx.createRadialGradient(
        ion.x,
        ion.y,
        2,
        ion.x,
        ion.y,
        rOuter
      );
      glow.addColorStop(0, "rgba(248, 250, 252, 0.9)");
      glow.addColorStop(1, "rgba(148, 163, 184, 0.05)");

      ctx.beginPath();
      ctx.fillStyle = glow;
      ctx.arc(ion.x, ion.y, rOuter, 0, Math.PI * 2);
      ctx.fill();

      const core = ctx.createLinearGradient(
        ion.x - rInner,
        ion.y - rInner,
        ion.x + rInner,
        ion.y + rInner
      );
      core.addColorStop(0, "#e5e7eb");
      core.addColorStop(1, "#9ca3af");

      ctx.beginPath();
      ctx.fillStyle = core;
      ctx.arc(ion.x, ion.y, rInner, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.font = "12px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", ion.x, ion.y + 1);
    }
  }

  drawElectrons() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const e of this.electrons) {
      const r = 4;

      const glow = ctx.createRadialGradient(e.x, e.y, 0.5, e.x, e.y, r * 2.3);
      glow.addColorStop(0, "rgba(56, 189, 248, 0.95)");
      glow.addColorStop(0.6, "rgba(8, 47, 73, 0.5)");
      glow.addColorStop(1, "rgba(8, 47, 73, 0)");

      ctx.beginPath();
      ctx.fillStyle = glow;
      ctx.arc(e.x, e.y, r * 2.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = "#e0f2fe";
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
    ctx.fillText("Delocalised electrons", 38, 45);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "12px system-ui";
    ctx.fillText("move freely through the giant", 38, 64);
    ctx.fillText("lattice of positive metal ions.", 38, 80);
  }

  draw() {
    this.drawBackground();
    this.drawIons();
    this.drawElectrons();
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

// Easing functions used in hammer animation
function easeOutQuad(t) {
  t = clamp(t, 0, 1);
  return 1 - (1 - t) * (1 - t);
}

function easeOutCubic(t) {
  t = clamp(t, 0, 1);
  return 1 - Math.pow(1 - t, 3);
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
      "This explains high electrical and thermal conductivity.",
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
};

const sceneTextEl = document.getElementById("sceneText");
const playPauseBtn = document.getElementById("playPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const navButtons = document.querySelectorAll(".nav-button");
const quizContainer = document.getElementById("quizContainer");
const checkAnswersBtn = document.getElementById("checkAnswersBtn");
const quizFeedback = document.getElementById("quizFeedback");

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
  `;

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
    if (!sceneKey || !scenes[sceneKey]) return;
    currentScene = sceneKey;
    navButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    scenes[sceneKey].reset();
    renderSceneText(sceneKey);
    renderQuiz(sceneKey);
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
requestAnimationFrame(animate);
