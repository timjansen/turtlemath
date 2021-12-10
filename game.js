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
var PROGRESS_TO_LOSE_PER_SECOND = [0.05, 0.2, 0.4, 0.6, 0.8, 1, 1.5, 2, 3, 10];
var lastLogicUpdate = 0;
var progress = 0; // 0-100; in GameState.Play
var displayedProgress = 0; // 0-100; in GameState.Play
var currentResult = ''; // the expected result; in GameState.Play
var turtleVelocity = 0;
// GameState.NextLevel
var NEXT_LEVEL_DURATION = 4; // in seconds
var nextLevelStartTime = 0;
var newShell;
function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
function getTask() {
    var x = Math.floor(Math.random() * 9.99) + 1;
    var y = Math.floor(Math.random() * 9.99) + 1;
    return ["".concat(x, " x ").concat(y, " ="), "".concat(x * y)];
}
function showTask() {
    var _a = getTask(), question = _a[0], result = _a[1];
    document.getElementById('question').innerText = question;
    document.getElementById('answer').innerText = '?';
    currentResult = result;
}
function play() {
    state = GameState.Play;
    progress = displayedProgress = turtleVelocity = 0;
    document.getElementById('debug').innerText = "Play Level: ".concat(currentLevel);
    showTask();
}
function enterResult() {
    if (document.getElementById('answer').textContent == currentResult) {
        progress = Math.min(100, progress + 5);
        if (progress >= 100) {
            nextLevel();
        }
        else
            showTask();
    }
    else
        progress = Math.max(0, progress - 3);
    var turleX = Math.max(0, Math.min(progress, 90));
    document.getElementById('turtle').style.left = "".concat(turleX, "%");
    document.getElementById('answer').textContent = '?';
}
function handleKeyPress(e) {
    if (e.code == 'Escape') {
        e.preventDefault();
        document.getElementById('answer').textContent = '?';
    }
    if (e.code == 'Backspace') {
        e.preventDefault();
        var a = document.getElementById('answer');
        var txt = a.textContent;
        if (txt.length < 2)
            a.textContent = '?';
        else
            a.textContent = txt.substring(0, txt.length - 1);
    }
    else if (e.code == 'Enter') {
        e.preventDefault();
        enterResult();
    }
    else if (e.key.charCodeAt(0) >= 48 && e.key.charCodeAt(0) <= 57) {
        var digit = e.key.charCodeAt(0) - 48;
        var a = document.getElementById('answer');
        var txt = a.textContent;
        if (txt == '?' || txt == '') {
            a.textContent = digit.toString();
        }
        else if (txt.length == 1 || txt.length == 2) {
            a.textContent = txt + digit;
        }
        else {
            a.textContent = '?';
        }
        if (a.textContent == currentResult)
            enterResult();
        else if (a.textContent.length >= currentResult.length)
            enterResult();
        e.preventDefault();
    }
    return false;
}
function progressToX(p, e) {
    return 10 + Math.max(0, Math.min(p, 100)) / 100 *
        (document.getElementById('sea').offsetWidth - e.offsetWidth - 10);
}
function gameLogic(time, d) {
    var losingTime = (time - lastLogicUpdate) / 1000;
    if (losingTime > TIME_TO_LOSE_PROGRESS && progress < 100) {
        progress = Math.max(0, progress - losingTime * PROGRESS_TO_LOSE_PER_SECOND[currentLevel % PROGRESS_TO_LOSE_PER_SECOND.length]);
        lastLogicUpdate = time;
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
}
function nextLevel() {
    state = GameState.NextLevel;
    currentLevel++;
    nextLevelStartTime = undefined;
    document.getElementById('debug').innerText = "Next Level: ".concat(currentLevel);
    newShell = document.createElement('img');
    newShell.src = 'assets/shell-1.svg';
    newShell.classList.add('sprite');
    newShell.classList.add('shell');
    newShell.style.top = '0';
    newShell.style.right = "".concat(10 + 35 * currentLevel, "px");
    document.getElementById('sea').appendChild(newShell);
    document.getElementById('levelOverlayContent').innerText = "Level ".concat(currentLevel);
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
window.addEventListener('DOMContentLoaded', function () {
    document.addEventListener("keydown", handleKeyPress);
    showTask();
});
window.requestAnimationFrame(animate);
play();
//# sourceMappingURL=game.js.map