
import { Injectable } from '@angular/core';

@Injectable()
export class MlService {

  // simulated constants
  public wheelRadius: number = (1 / (Math.PI * 2)); // ~0.16 meters
  public botWidth: number = 50 // width between wheels in px
  public timeUnit: number = 1 // number of seconds sim

  // service properties
 // private ml = require('ml-regression');
 // private SLR = this.ml.SLR; // Simple Linear Regression
  private regressionModel; 
  private inputPositionChanges: number[][] = []; 
  private outputCommands: number[][] = []; 

  constructor() { }

  /** train ML model with user-given commands */
  train(leftCmd, rightCmd, pos, newPos) {
    var posChange = this.getPosChange(pos, newPos);
    this.record(leftCmd, rightCmd, posChange.x, posChange.y);

    // train the model on training data
   // this.regressionModel = new this.SLR(this.inputPositionChanges, this.outputCommands); 
    console.log(this.regressionModel.toString(3));
  }

  /** record command and result of executing it as ML training data */
  record(leftCmd, rightCmd, xChange, yChange) {
    // plot left + right command, pos change X + Y as one point in ML training data
    this.inputPositionChanges.push([leftCmd, rightCmd]); 
    this.outputCommands.push([xChange, yChange]); 
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
  predictCommand(xDiff, yDiff) {
    this.regressionModel.predict([[xDiff, yDiff]]); 
  }
}
