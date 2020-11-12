class Droplet{
  constructor(){
    this.x = random(-width/2, width*1.5);
    this.y = -20;
    this.z = random();
    let a = PI/2 + random(0, .1) + .1;
    this.dx = cos(a)*(this.z*5 + 1);
    this.dy = sin(a)*(this.z*5 + 1);
    this.splash = false;
    this.dead   = false;
    this.amt = 0;
  }
  update(){
    if (!this.splash){
      this.prevX = this.x;
      this.prevY = this.y;
      this.x += this.dx;
      this.y += this.dy;
    }
    else {
      this.amt += .01;
      if (this.amt > 1) this.dead = true;
    }
    if (this.y > height*(1 - (1-this.z)/4)) this.splash = true;
  }
  render(){
    if (this.splash){
      buffer.stroke(1, (1-this.amt)/3);
      buffer.noFill();
      let w = this.amt*(this.z + .05)*100;
      buffer.ellipse(this.x, this.y, w, w/3);
    } else {
      buffer.stroke(1);
      buffer.line(this.prevX, this.prevY, this.x, this.y);
    }
  }
}

class Lightning{
  constructor(){
    this.x = random(width);
    this.y = 0;
    this.amt = 1;
    
    this.hue = random(.5, .8);
    this.seed = frameCount;
    
    let sound = random(thunder);
    sound.setVolume(.5);
    sound.play();
    let points = [createVector(this.x, height*.7)];
    let n = random(30, 50);
    let w = random(200, 300);
    for (let i = 0; i < n; i++){
      let amt = random();
      let y = amt*height*.7;
      let x = this.x + random(-w, w)*(1 - abs(amt*2 - 1));
      points.push(createVector(x, y));
    }
    
    let fill = [createVector(this.x, this.y)];
    this.lines = [];
    while(points.length > 0){
      let d = 1e6;
      let fIdx = 0;
      let pIdx = 0;
      fill.forEach((p1, i) => {
        points.forEach((p2, j) => {
          let d2 = p1.dist(p2);
          let a = p1.angleBetween(p2);
          if (d2 < d && a > 0){
            d = d2;
            fIdx = i;
            pIdx = j;
          }
        });
      });
      let p1 = fill[fIdx];
      let p2 = points[pIdx];
      this.lines.push({p1, p2})
      fill.push(points[pIdx]);
      points.splice(pIdx, 1);
    };
    this.points = fill;
  }
  update(){
    this.amt -= .01;
    this.light = noise(this.seed + pow(this.amt, .1)*100)*this.amt*3;
  }
  render(buffer){
    buffer.stroke(this.hue, .3, this.light);
    buffer.strokeWeight(2);
    this.lines.forEach(l => {
      let {p1, p2} = l;
      buffer.line(p1.x, p1.y, p2.x, p2.y);
    });
  }
}

let soundsLoaded = false;
let thunder = [{play:() => {}, setVolume:() => {}}];
function loadSounds(){
  soundsLoaded = true;
  thunder = [];
  let path = "https://www.cs.unm.edu/~bmatthews1/hosted/sounds/sounds/";
  soundFormats('wav');
  let rain = loadSound(path + "rain", () => {
    rain.setVolume(3);
    rain.play();
  });
  for (let i = 1; i < 9; i++) thunder.push(loadSound(path + "thunder" + i, ));
}

function setup (){
  pixelDensity(1);
  createCanvas();
  colorMode(HSB, 1, 1, 1);
  windowResized();
}

let drops, buffer, lightning;
let init = () => {
  drops = [];
  lightning = [];
  buffer = createGraphics(width, height);
  buffer.colorMode(HSB, 1, 1, 1);
}

function draw(){
  background(0);
  
  if (!soundsLoaded && frameCount > 150){
    loadSounds();
  }
  
  for (let y = floor(height*.7); y < height; y++){
    let amt = (y-height*.7)/(height*.3);
    stroke(.6, 1, amt);
    line(0, y, width, y);
  }
  
  buffer.blendMode(BLEND);
  buffer.background(0, .2);
  buffer.blendMode(ADD);
  for (let i = 0; i < 2*width/1000; i++) drops.push(new Droplet());
  drops.forEach(d => {
    d.update();
    d.render();
  })
  drops = drops.filter(d => !d.dead);
  
  if (random() < .005 && lightning.length < 3) lightning.push(new Lightning());
  lightning.forEach(l => {
    l.render(this);
    l.update();
  });
  lightning = lightning.filter(l => l.amt > 0);
  
  blendMode(ADD);
  image(buffer, 0, 0);
  
  lightning.forEach(l => {
    background(l.hue, .3, l.light, .2);
  });
  
  blendMode(BLEND);
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  init();
}