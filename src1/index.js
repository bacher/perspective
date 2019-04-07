const { vec3, vec4, mat3, mat4 } = glMatrix;

const canvas = document.getElementById('canvas');

canvas.width = 600;
canvas.height = 400;

let xAngle = 18;

let deltaX = 0;
let deltaY = 0;

const mTr = mat4.create();
const mRot = mat4.create();

const mPer = mat4.perspective(
  mat4.create(),
  (75 * Math.PI) / 180,
  canvas.width / canvas.height,
  0.1,
  500
);

mat4.rotateX(mRot, mRot, (xAngle * Math.PI) / 180);

const characters = [
  {
    pos: {
      x: 0,
      y: 0,
      z: 0,
    },
    color: '#f00',
    img: createSprite('character'),
  },
  // {
  //   pos: {
  //     x: 0.1441,
  //     y: -92.69,
  //     z: 0,
  //   },
  //   color: '#0f0',
  //   img: createSprite('character'),
  // },
];

const redDots = [
  {
    x: -273.67,
    y: 187.12,
    z: 0,
  },
  {
    x: -150,
    y: -100,
    z: 0,
  },
];

function createSprite(name) {
  const img = new Image();
  img.src = `../assets/sprites/${name}.png`;

  document.getElementById('sprites').appendChild(img);

  return img;
}

function draw() {
  const ctx = canvas.getContext('2d');

  ctx.save();
  ctx.strokeStyle = '#ddd';
  ctx.fillStyle = '#fff';

  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);

  mat4.fromTranslation(mTr, vec3.fromValues(-deltaX, -deltaY, 300));

  const width = 300;
  const widthD2 = width / 2;

  const height = 200;
  const heightD2 = height / 2;

  for (let x = -widthD2; x <= widthD2; x += 10) {
    drawLine({ x, y: -heightD2, z: 0 }, { x, y: heightD2, z: 0 });
    break;
  }

  for (let y = -heightD2; y <= heightD2; y += 10) {
    drawLine({ x: -widthD2, y, z: 0 }, { x: widthD2, y, z: 0 });
    break;
  }

  for (const pos of redDots) {
    drawDot(pos);
  }

  function drawLine(p1, p2) {
    const p1n = func(p1);
    const p2n = func(p2);

    if (
      Number.isFinite(p1n.x) &&
      Number.isFinite(p1n.y) &&
      Number.isFinite(p2n.x) &&
      Number.isFinite(p2n.y)
    ) {
      ctx.beginPath();
      ctx.moveTo(p1n.x, p1n.y);
      ctx.lineTo(p2n.x, p2n.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(p1n.x, p1n.y, 5, 0, 2 * Math.PI);
      ctx.stroke();

      console.log('INPUT:', p1);
    }
  }

  function drawDot(pos) {
    const p = func(pos);
    ctx.beginPath();
    ctx.fillStyle = '#f00';
    ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
    ctx.fill();
  }

  for (const char of characters) {
    const pos = func(char.pos);

    char.img.style = `position: absolute; top: ${pos.y}px; left: ${pos.x}px;`;
  }

  function func({ x, y, z }) {
    let res = vec3.fromValues(x, y, z || 0);

    const isPers = true;

    // const mView = mPer.multiply(mTr).multiply(mRot);
    vec3.transformMat4(res, res, mRot);
    vec3.transformMat4(res, res, mTr);

    if (isPers) {
      vec3.transformMat4(res, res, mPer);
    }

    return {
      x: res[0] * (isPers ? canvas.width : 1),
      y: res[1] * (isPers ? canvas.height : 1),
      z: res[2],
    };
  }

  ctx.restore();

  requestAnimationFrame(draw);
}

// window.addEventListener('mousemove', e => {
//   deltaX += e.movementX;
//   deltaY += e.movementY;
// });

window.addEventListener('mousemove', e => {
  const p = { x: e.clientX, y: e.clientY };

  const r1 = screenCoordsToWorld({ ...p, z: 0.4 });
  const r2 = screenCoordsToWorld({ ...p, z: 0.5 });

  const l = r1.x - r2.x;
  const m = r1.y - r2.y;
  const n = r1.z - r2.z;

  const zValue = -r1.z / n;

  const x = zValue * l + r1.x;
  const y = zValue * m + r1.y;

  characters[0].pos.x = x;
  characters[0].pos.y = y;

  // document.getElementById('info').innerText = JSON.stringify(point, null, 2);
  document.getElementById('info').innerText = JSON.stringify(
    //[r1, r2],
    { x, y },
    null,
    2
  );
});

function screenCoordsToWorld(p) {
  const mPerI = mat4.create();
  mat4.invert(mPerI, mPer);
  const mRotI = mat4.create();
  mat4.invert(mRotI, mRot);
  const mTrI = mat4.create();
  mat4.fromTranslation(mTr, vec3.fromValues(-deltaX, -deltaY, 300));
  mat4.invert(mTrI, mTr);

  const res = vec3.fromValues(p.x / canvas.width, p.y / canvas.height, p.z);

  vec3.transformMat4(res, res, mPerI);
  vec3.transformMat4(res, res, mTrI);
  vec3.transformMat4(res, res, mRotI);

  return {
    x: res[0],
    y: res[1],
    z: res[2],
  };
}

draw();

// setInterval(() => {
//   xAngle += 9;
// }, 16);