var GameState;
(function (GameState) {
    GameState[GameState["Play"] = 0] = "Play";
    GameState[GameState["NextLevel"] = 1] = "NextLevel";
})(GameState || (GameState = {}));
var state = GameState.Play;
var currentLevel = 0; // -> number of shells
// Render
var starRotation = 0;
// GameState.Play
var TIME_TO_LOSE_PROGRESS = 0.01; // in seconds
var lastLogicUpdate = 0;
var progress = 0; // 0-100
var displayedProgress = 0; // 0-100
var currentTask = ''; // the current task
var displayedTask = ''; // the task currently displayed
var currentResult = ''; // the expected result
var currentHint = ''; // the current hint 
var displayedHint = ''; // the hint currently displayed
var currentInput = ''; // the current input. Empty if nothing.
var toShowInput = '?';
var displayedInput = '?'; // the currently displayed input. '?' if nothing.
var inputShake = 0; // set to shake the wrong input
var taskStartTime; // when the current task started
var showHint = false; // the current hinting status
var turtleVelocity = 0;
var ResultState;
(function (ResultState) {
    ResultState[ResultState["Input"] = 0] = "Input";
    ResultState[ResultState["Good"] = 1] = "Good";
    ResultState[ResultState["Bad"] = 2] = "Bad";
})(ResultState || (ResultState = {}));
;
var resultState = ResultState.Input;
var resultStateStart = 0;
// GameState.NextLevel
var NEXT_LEVEL_DURATION = 4; // in seconds
var nextLevelStartTime = 0;
var newShell;
function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
function createTask() {
    var level = LEVELS[currentLevel % LEVELS.length];
    if (level.op == '*') {
        var x = Math.floor(Math.random() * (level.minNumberRange[1] - level.minNumberRange[0])) + level.minNumberRange[0];
        var y = Math.floor(Math.random() * (level.maxNumberRange[1] - level.maxNumberRange[0])) + level.maxNumberRange[0];
        var task = Math.random() < 0.5 ? "".concat(x, " x ").concat(y, " =") : "".concat(y, " x ").concat(x, " =");
        if (task == currentTask)
            return createTask();
        currentTask = task;
        taskStartTime = undefined;
        currentResult = currentHint = "".concat(x * y);
        showHint = false;
    }
    else
        throw new Error('Unknown operation ' + level.op);
}
function play() {
    state = GameState.Play;
    progress = displayedProgress = turtleVelocity = 0;
    createTask();
}
function enterResult() {
    if (currentInput == currentResult) {
        progress = Math.min(100, progress + 5);
        if (progress >= 100)
            nextLevel();
        else
            createTask();
        resultState = ResultState.Good;
    }
    else {
        progress = Math.max(0, progress - 3);
        toShowInput = currentInput;
        resultState = ResultState.Bad;
    }
    currentInput = '';
    resultStateStart = undefined;
}
function handleKeyPress(e) {
    if (state != GameState.Play) {
        e.preventDefault();
        return false;
    }
    if (e.code == 'Escape') {
        e.preventDefault();
        resultState = ResultState.Input;
        resultStateStart = undefined;
        currentInput = '';
    }
    if (e.code == 'Backspace') {
        e.preventDefault();
        resultState = ResultState.Input;
        resultStateStart = undefined;
        currentInput = currentInput.substring(0, currentInput.length - 1);
    }
    else if (e.code == 'Enter' || e.code == 'NumpadEnter') {
        e.preventDefault();
        enterResult();
    }
    else if (e.key.charCodeAt(0) >= 48 && e.key.charCodeAt(0) <= 57) {
        e.preventDefault();
        resultState = ResultState.Input;
        resultStateStart = undefined;
        var digit = e.key.charCodeAt(0) - 48;
        if (currentInput == '') {
            currentInput = digit.toString();
        }
        else if (currentInput.length < 5) {
            currentInput += digit;
        }
        if (currentInput == currentResult)
            enterResult();
        else if (currentInput.length >= currentResult.length)
            enterResult();
    }
    return false;
}
function progressToX(p, e) {
    return 10 + Math.max(0, Math.min(p, 100)) / 100 *
        (document.getElementById('sea').offsetWidth - e.offsetWidth - 10);
}
function gameLogic(time, d) {
    var level = LEVELS[currentLevel % LEVELS.length];
    var losingTime = (time - lastLogicUpdate) / 1000;
    if (losingTime > TIME_TO_LOSE_PROGRESS && progress < 100) {
        progress = Math.max(0, progress - losingTime * level.lostProgressPerSecond);
        lastLogicUpdate = time;
    }
    if (!taskStartTime)
        taskStartTime = time;
    else {
        showHint = (time - taskStartTime) / 1000 > level.timeToHint;
    }
}
function gameAnimate(time, d) {
    if (displayedProgress != progress) {
        if (progress > displayedProgress)
            turtleVelocity = (progress - displayedProgress) / 500000;
        else
            turtleVelocity = (progress - displayedProgress) / 500000;
    }
    else
        turtleVelocity = 0;
    if (turtleVelocity > 0)
        displayedProgress = Math.min(displayedProgress + turtleVelocity * d, progress);
    if (turtleVelocity < 0)
        displayedProgress = Math.max(displayedProgress + turtleVelocity * d, progress);
    if (!resultStateStart)
        resultStateStart = time;
    if ((time - resultStateStart) / 1000 > 0.6 && resultState != ResultState.Input) {
        resultState = ResultState.Input;
        resultStateStart = time;
        inputShake = 0;
        currentInput = '';
    }
    else if (resultState == ResultState.Bad)
        inputShake = Math.sin(time / 20) * 10;
    else
        inputShake = 0;
    toShowInput = (resultState == ResultState.Input || resultState == ResultState.Good) ? (currentInput || '?') : (currentInput || toShowInput);
}
function gameRender(time, d) {
    var turtle = document.getElementById('turtle');
    turtle.style.top = "".concat(50 + (10 * Math.cos(time / 750)), "px");
    turtle.style.left = "".concat(progressToX(displayedProgress, turtle) + (5 * Math.cos(time / 2322)), "px");
    turtle.style.transform = "rotate(".concat(4 * Math.cos(Math.PI + time / 2750), "deg)");
    var star = document.getElementById('star');
    star.style.top = "".concat(25 + (5 * Math.cos(time / 1005)), "px");
    star.style.left = "".concat(progressToX(100, star) + (5 * Math.cos(time / 2071)), "px");
    star.style.transform = "rotate(".concat(6 * Math.cos(Math.PI + time / 606) + starRotation, "deg)");
    var hint = document.getElementById('hint');
    if (showHint) {
        hint.classList.add('showHint');
        if (displayedHint != currentHint)
            document.getElementById('hint').textContent = displayedHint = currentHint;
    }
    else
        hint.classList.remove('showHint');
    if (displayedTask != currentTask)
        document.getElementById('question').textContent = displayedTask = currentTask;
    if (displayedInput != toShowInput)
        document.getElementById('answer').textContent = displayedInput = toShowInput;
    document.getElementById('task').style.paddingLeft = "".concat(inputShake, "px");
}
function nextLevel() {
    state = GameState.NextLevel;
    currentLevel++;
    nextLevelStartTime = undefined;
    newShell = document.createElement('img');
    newShell.src = 'assets/shell-1.svg';
    newShell.classList.add('sprite');
    newShell.classList.add('shell');
    newShell.style.top = '0';
    newShell.style.right = "".concat(10 + 35 * currentLevel, "px");
    document.getElementById('sea').appendChild(newShell);
    document.getElementById('levelOverlayContent').innerText = "Level ".concat(currentLevel + 1);
    document.getElementById('levelOverlay').style.display = undefined;
}
function nextLevelControl(time, d) {
    if (nextLevelStartTime == undefined)
        nextLevelStartTime = time;
    var passed = (time - nextLevelStartTime) / (NEXT_LEVEL_DURATION * 1000);
    if (passed > 1) {
        document.getElementById('levelOverlay').style.display = 'none';
        play();
        return;
    }
    starRotation = passed * 360;
    displayedProgress = 100 - easeInOutCubic(passed) * 100;
    newShell.style.top = "".concat(-75 + easeInOutCubic(passed) * 75, "px");
    if (passed < 0.2)
        document.getElementById('levelOverlay').style.opacity = "".concat(passed / 0.2);
    else if (passed > 0.8)
        document.getElementById('levelOverlay').style.opacity = "".concat(1 - (passed - 0.8) / 0.2);
    else
        document.getElementById('levelOverlay').style.opacity = '1';
}
var lastAnimate = 0;
function animate(time) {
    var d = time - lastAnimate;
    switch (state) {
        case GameState.Play:
            gameLogic(time, d);
            gameAnimate(time, d);
            gameRender(time, d);
            break;
        case GameState.NextLevel:
            nextLevelControl(time, d);
            gameRender(time, d);
            break;
    }
    window.requestAnimationFrame(animate);
}
function init() {
    createTask();
}
document.addEventListener('DOMContentLoaded', init);
window.requestAnimationFrame(animate);
document.addEventListener("keydown", handleKeyPress);
play();
//# sourceMappingURL=game.js.map