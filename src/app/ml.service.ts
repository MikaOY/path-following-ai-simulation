
import { Injectable } from '@angular/core';

@Injectable()
export class MlService {

  // simulated constants
  private wheelRadius: number = (1 / (Math.PI * 2)); // ~0.16 meters
  public botWidth: number = 50 // width between wheels in px

  private ml = require('ml-regression');
  private SLR = this.ml.SLR; // Simple Linear Regression
  private regressionModel; 

  private inputCommands: number[][] = []; 
  private outputPositionChanges: number[][] = []; 

  constructor() { }

  /** train ML model with user-given commands */
  train(leftCmd, rightCmd, pos, newPos) {
    var posChange = this.getPosChange(pos, newPos);
    this.record(leftCmd, rightCmd, posChange.x, posChange.y);

    // train the model on training data
    this.regressionModel = new this.SLR(this.inputCommands, this.outputPositionChanges); 
    console.log(this.regressionModel.toString(3));
  }

  /** get command as input from user */
  getCmdInput() {
    // get user input for random command 
  }

  /** execute given command */
  execCmd(cmd) {
    // move robot according to given command
  }

  /** record command and result of executing it as ML training data */
  record(leftCmd, rightCmd, xChange, yChange) {
    // plot left + right command, pos change X + Y as one point in ML training data
    this.inputCommands.push([leftCmd, rightCmd]); 
    this.outputPositionChanges.push([xChange, yChange]); 
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
    //var moveDistance = this.getPosChange(this.getPos(), point);
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
