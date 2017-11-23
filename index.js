
/** train ML model with user-given commands */
function train() {
  var cmd = getCmdInput();
  var pos = getPos();
  execCmd(cmd);
  var newPos = getPos();

  var posChange = getPosChange(pos, newPos); 
  record(cmd, posChange.tetha, posChange.r);
}

/** get command as input from user */
function getCmdInput() {
  // get user input for random command 
}

/** get bot's current polar position */
function getPos() {
  // get bot absolute position
}

/** execute given command */
function execCmd(cmd) {
  // move robot according to given command
}

/** record command and result of executing it as ML training data */
function record(cmd, bearingChange, rChange) {
  // plot cmd, bearing change, pos change as one point in ML training data
}

/** 
 * get difference between given positions 
 * @returns {{tetha, r}} - change in polar positions, in polar format
 */
function getPosChange(pos, newPos) {
  // get current position diff from given
}

/**
 * attempt to follow path defined by an array of points
 * @param {{tetha, r}[]} pointsArray - Array of points that define the path to follow. 
 */
function work(pointsArr) {
  pointsArr.forEach(function(point) {
    move(point); 
    if (checkBatteryBelowLevel()) {
      charge(); 
    }
  }, this);
}

/**
 * move bot to point specified
 * @param {{tetha, r}} point - absolute polar (tetha, r) point
 */
function move(point) {
  var polarMoveDistance = getPosChange(getPos(), point); 
  // look for match in ML
  // move bot to point, animated, with delay to show movement
}

/**
 * check if battery is lower than given percentage (if undefined param, default to 15%)
 * @returns {boolean}
 */
function checkBatteryBelowLevel(percentage) {
  // check if below percentage given if not undefined
}

/** return to charging station pos */
function charge() {

}
