
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
    this.record(cmd, posChange.tetha, posChange.r);
  }

  /** get command as input from user */
  getCmdInput() {
    // get user input for random command 
  }

  /** get bot's current polar position */
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
   * @returns {{tetha, r}} - change in polar positions, in polar format
   */
  getPosChange(pos, newPos): { tetha: number, r: number } {
    // get current position diff from given
    return { tetha: 5, r: 5 }; 
  }

  /**
   * attempt to follow path defined by an array of points
   * @param {{tetha, r}[]} pointsArray - Array of points that define the path to follow. 
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
   * @param {{tetha, r}} point - absolute polar (tetha, r) point
   */
  move(point) {
    var polarMoveDistance = this.getPosChange(this.getPos(), point);
    // look for match in ML
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
