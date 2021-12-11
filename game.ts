enum GameState {
    Play,
    NextLevel
}

let state = GameState.Play;
let currentLevel = 0;                   // -> number of shells

// Render
let starRotation = 0;


// GameState.Play
const TIME_TO_LOSE_PROGRESS = 0.01; // in seconds

let lastLogicUpdate = 0;

let progress = 0;                       // 0-100
let displayedProgress = 0;              // 0-100
let currentTask: string = '';           // the current task
let currentResult: string = '';         // the expected result
let currentHint: string = '';           // the current hint 
let taskStartTime: number|undefined;    // when the current task started
let showHint = false;                   // the current hinting status
let turtleVelocity = 0;

// GameState.NextLevel
const NEXT_LEVEL_DURATION = 4;          // in seconds
let nextLevelStartTime = 0;
let newShell: HTMLImageElement;

function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function getTask(): [string,string] {
    const level = LEVELS[currentLevel % LEVELS.length];

    if (level.op == '*') {
        const x = Math.floor(Math.random() * (level.minNumberRange[1]-level.minNumberRange[0])) + level.minNumberRange[0];
        const y = Math.floor(Math.random() * (level.maxNumberRange[1]-level.maxNumberRange[0])) + level.maxNumberRange[0];
        const task = Math.random() < 0.5 ? `${x} x ${y} =` : `${y} x ${x} =`;
        if (task == currentTask)
            return getTask();
        currentTask = task;
        taskStartTime = undefined;
        currentResult = currentHint = `${x * y}`;
        showHint = false;
        return [task, currentHint];
    }
    else
        throw new Error('Unknown operation ' + level.op);
}

function showTask(): void {
    getTask();
    document.getElementById('question').innerText = currentTask;
    document.getElementById('answer').innerText = '?';
    document.getElementById('hint').innerText = currentHint;
}

function play(): void {
    state = GameState.Play;
    progress = displayedProgress = turtleVelocity = 0;

    showTask();
}

function enterResult(): void {
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
    const turleX = Math.max(0, Math.min(progress, 90));
    document.getElementById('turtle').style.left = `${turleX}%`;
    document.getElementById('answer').textContent = '?';
}

function handleKeyPress(e: KeyboardEvent): boolean {
    if (e.code == 'Escape') {
        e.preventDefault();
        document.getElementById('answer').textContent = '?';
    }
    if (e.code == 'Backspace') {
        e.preventDefault();
        const a = document.getElementById('answer');
        const txt = a.textContent;
        if (txt.length < 2)
            a.textContent = '?';
        else
            a.textContent = txt.substring(0, txt.length - 1);
    }
    else if (e.code == 'Enter' || e.code == 'NumpadEnter') {
        e.preventDefault();
        enterResult();
    }
    else if (e.key.charCodeAt(0) >= 48 && e.key.charCodeAt(0) <= 57) {
        const digit = e.key.charCodeAt(0) - 48;
        const a = document.getElementById('answer');
        const txt = a.textContent;
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

function progressToX(p: number, e: HTMLElement): number {
    return 10 + Math.max(0, Math.min(p, 100))/100 * 
        (document.getElementById('sea').offsetWidth - e.offsetWidth - 10);
}

function gameLogic(time: DOMHighResTimeStamp, d: number): void {
    const level = LEVELS[currentLevel % LEVELS.length];
    const losingTime = (time - lastLogicUpdate)/1000;
    if (losingTime > TIME_TO_LOSE_PROGRESS && progress < 100) {
        progress = Math.max(0, progress - losingTime*level.lostProgressPerSecond);
        lastLogicUpdate = time;
    }

    if (!taskStartTime)
        taskStartTime = time;
    else {
        showHint = (time - taskStartTime) / 1000 > level.timeToHint;
    }
}

function gameAnimate(time: DOMHighResTimeStamp, d: number): void {
    if (displayedProgress != progress) {
        if (progress > displayedProgress)
            turtleVelocity = (progress-displayedProgress)/500000;
        else
            turtleVelocity = (progress-displayedProgress)/500000;
    }
    else
        turtleVelocity = 0;

    if (turtleVelocity > 0)
        displayedProgress = Math.min(displayedProgress + turtleVelocity * d, progress);
    if (turtleVelocity < 0)
        displayedProgress = Math.max(displayedProgress + turtleVelocity * d, progress);
}

function gameRender(time: DOMHighResTimeStamp, d: number): void {
    const turtle = document.getElementById('turtle');
    turtle.style.top = `${50+(10*Math.cos(time/750))}px`;
    turtle.style.left = `${progressToX(displayedProgress, turtle)+(5*Math.cos(time/2322))}px`;
    turtle.style.transform = `rotate(${4*Math.cos(Math.PI+time/2750)}deg)`;
    const star = document.getElementById('star');
    star.style.top = `${25+(5*Math.cos(time/1005))}px`;
    star.style.left = `${progressToX(100, star)+(5*Math.cos(time/2071))}px`;
    star.style.transform = `rotate(${6*Math.cos(Math.PI+time/606) + starRotation}deg)`;

    const hint = document.getElementById('hint');
    hint.style.display = showHint ? 'block' : 'none';
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
    newShell.style.right = `${10 + 35 * currentLevel}px`;
    document.getElementById('sea').appendChild(newShell);

    document.getElementById('levelOverlayContent').innerText = `Level ${currentLevel}`;
    document.getElementById('levelOverlay').style.display = undefined;
}

function nextLevelControl(time: DOMHighResTimeStamp, d: number): void {
    if (nextLevelStartTime == undefined)
        nextLevelStartTime = time;

    const passed = (time - nextLevelStartTime) / (NEXT_LEVEL_DURATION*1000);
    if (passed > 1) {
        document.getElementById('levelOverlay').style.display = 'none';
        play();
        return;
    }

    starRotation = passed*360;
    displayedProgress = 100 - easeInOutCubic(passed) * 100;
    newShell.style.top = `${-75 + easeInOutCubic(passed) * 75}px`;

    if (passed < 0.2)
        document.getElementById('levelOverlay').style.opacity = `${passed/0.2}`;
    else if (passed > 0.8)
        document.getElementById('levelOverlay').style.opacity = `${1-(passed-0.8)/0.2}`;
    else
        document.getElementById('levelOverlay').style.opacity = '1';
}


let lastAnimate = 0;
function animate(time: DOMHighResTimeStamp): void {
    const d = time - lastAnimate;
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

function init(): void {
    showTask();
}

document.addEventListener('DOMContentLoaded', init);
window.requestAnimationFrame(animate);
document.addEventListener("keydown", handleKeyPress);
play();
