
import { Injectable } from '@angular/core';

@Injectable()
export class MlService {

  constructor() { }

  private wheelRadius: number = (1 / (Math.PI * 2)); // ~0.16 meters

  /** train ML model with user-given commands */
  train() {
    var cmd = this.getCmdInput();
    var pos = this.getPos();
    this.execCmd(cmd);
    var newPos = this.getPos();

    var posChange = this.getPosChange(pos, newPos);
    this.record(cmd, posChange.x, posChange.y);
  }

  /** get command as input from user */
  getCmdInput() {
    // get user input for random command 
  }

  /** get bot's current Cartesian position */
  getPos() {
    // get bot absolute position
  }

  /** execute given command */
  execCmd(cmd) {
    // move robot according to given command
  }

  /** record command and result of executing it as ML training data */
  record(cmd, bearingChange, rChange) {
    // plot cmd, bearing change, pos change as one point in ML training data
  }

  /** 
   * get difference between given positions 
   * @returns {{x, y}} - change in Cartesian coordinates
   */
  getPosChange(pos, newPos): { x: number, y: number } {
    // get current position diff from given
    return { x: 5, y: 5 }; 
  }

  /**
   * attempt to follow path defined by an array of points
   * @param {{x, y}[]} pointsArray - Array of points that define the path to follow. 
   */
  work(pointsArr) {
    pointsArr.forEach((point) => {
      this.move(point);
      if (this.checkBattery()) {
        this.charge();
      }
    }, this);
  }

  /**
   * move bot to point specified
   * @param {{x, y}} point - absolute (x, r) point
   */
  move(point) {
    var moveDistance = this.getPosChange(this.getPos(), point);
    // query ML for extrapolated command
    // move bot to point, animated, with delay to show movement
  }

  /**
   * returns false if battery is lower than given percentage (if undefined param, default to 15%)
   * @returns {boolean}
   */
  checkBattery(percentage?): boolean {
    // check if below percentage given if not undefined
    return true; 
  }

  /** return to charging station pos */
  charge() {

  }
}
