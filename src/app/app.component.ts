import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D; 
  flag = false; 
  prevX = 0;
  currX = 0;
  prevY = 0;
  currY = 0;
  dot_flag = false;
  activeColor: string = "black"; 
  y = 2;
  canvasWidth: number; 
  canvasHeight: number; 

  ngOnInit() {
    this.canvas = document.getElementById('mah-canvas') as HTMLCanvasElement;

    if (this.canvas.getContext) {
      this.ctx = this.canvas.getContext('2d');

      // // rectangles
      // ctx.fillStyle = 'rgb(200, 0, 0)';
      // ctx.fillRect(10, 10, 50, 50);
      // ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
      // ctx.fillRect(30, 30, 50, 50);

      // // paths
      // ctx.beginPath();
      // ctx.moveTo(200, 80);
      // ctx.lineTo(100, 75);
      // ctx.lineTo(100, 25);
      // ctx.fill();

      this.canvasWidth = this.canvas.width;
      this.canvasHeight = this.canvas.height;

      this.canvas.addEventListener("mousemove", (e) => {
        this.findxy('move', e)
      }, false);
      this.canvas.addEventListener("mousedown", (e) => {
        this.findxy('down', e)
      }, false);
      this.canvas.addEventListener("mouseup", (e) => {
        this.findxy('up', e)
      }, false);
      this.canvas.addEventListener("mouseout", (e) => {
        this.findxy('out', e)
      }, false);
    }
  }

  color(obj) {
    console.log('Color picked!'); 
    switch (obj.id) {
      case "green":
        this.activeColor = "green";
        break;
      case "blue":
        this.activeColor = "blue";
        break;
      case "red":
        this.activeColor = "red";
        break;
      case "yellow":
        this.activeColor = "yellow";
        break;
      case "orange":
        this.activeColor = "orange";
        break;
      case "black":
        this.activeColor = "black";
        break;
      case "white":
        this.activeColor = "white";
        break;
    }

    if (this.activeColor == "white") this.y = 14;
    else this.y = 2;
  }

  draw() {
    this.ctx.beginPath();
    this.ctx.moveTo(this.prevX, this.prevY);
    this.ctx.lineTo(this.currX, this.currY);
    this.ctx.strokeStyle = this.activeColor;
    this.ctx.lineWidth = this.y;
    this.ctx.stroke();
    this.ctx.closePath();
  }

  erase() {
    var m = confirm("Are you sure you want to clear this path?");
    if (m) {
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      document.getElementById("canvasimg").style.display = "none";
    }
  }

  findxy(res, e) {
    if (res == 'down') {
      this.prevX = this.currX;
      this.prevY = this.currY;
      this.currX = e.clientX - this.canvas.offsetLeft;
      this.currY = e.clientY - this.canvas.offsetTop;

      this.flag = true;
      this.dot_flag = true;
      if (this.dot_flag) {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.activeColor;
        this.ctx.fillRect(this.currX, this.currY, 2, 2);
        this.ctx.closePath();
        this.dot_flag = false;
      }
    }
    if (res == 'up' || res == "out") {
      this.flag = false;
    }
    if (res == 'move') {
      if (this.flag) {
        this.prevX = this.currX;
        this.prevY = this.currY;
        this.currX = e.clientX - this.canvas.offsetLeft;
        this.currY = e.clientY - this.canvas.offsetTop;
        this.draw();
      }
    }
  }
}
