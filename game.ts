enum GameState {
    Play,
    NextLevel
}

type StoredGameState = {
    achievements: any;
    levelType: 'multiplication' | 'division';
};


const storedState: StoredGameState  = JSON.parse(window.localStorage.getItem('state') || JSON.stringify({achievements: {multiplication: 1, division: 1}, levelType: 'multipliciation'}));

let state = GameState.Play;
let currentLevel = 1;                   // -> number of shells-1
let levelType = 'multiplication';

// Render
let starRotation = 0;


// GameState.Play
const TIME_TO_LOSE_PROGRESS = 0.01; // in seconds

let lastLogicUpdate = 0;

let progress = 0;                       // 0-100
let displayedProgress = 0;              // 0-100
let currentTask: string = '';           // the current task
let displayedTask: string = '';         // the task currently displayed
let currentResult: string = '';         // the expected result
let currentHint: string = '';           // the current hint 
let displayedHint: string = '';         // the hint currently displayed

let currentInput: string = '';          // the current input. Empty if nothing.
let toShowInput: string = '?';
let displayedInput: string = '?';       // the currently displayed input. '?' if nothing.
let inputShake = 0;                     // set to shake the wrong input

let taskStartTime: number|undefined;    // when the current task started
let showHint = false;                   // the current hinting status
let turtleVelocity = 0;

enum ResultState {
    Input,
    Good,
    Bad,
};
let resultState = ResultState.Input;
let resultStateStart: number|undefined = 0;


// GameState.NextLevel
const NEXT_LEVEL_DURATION = 4;          // in seconds
let nextLevelStartTime = 0;
let newShells: HTMLImageElement[] = [];



function setAttrs(e: Element, attributeMap: any) {
    if (attributeMap)
        for (let name in attributeMap)
            e.setAttribute(name, attributeMap[name]);
}

function newElem(name: string, attributeMap?: any, children?: Element[]|Element|Text): Element {
    const e = document.createElement(name);
    setAttrs(e, attributeMap);
    if (Array.isArray(children))
        for (let child of children)
            e.appendChild(child);
    else if (children)
        e.appendChild(children);
    return e;
}

function newTxt(text: string): Text {
    return document.createTextNode(text);
}

function removeAllChildren(e: Element): void {
    while (e.firstChild)
        e.removeChild(e.firstChild);
}

function storeState() {
    window.localStorage.setItem('state', JSON.stringify(storedState));
    return storedState;
}

function selectLevel(e) {
    const level = parseInt(e.target.getAttribute('data-level-number'));
    nextLevel(level);
}

function updateLevelSelector() {
    const levelOverview = document.getElementById('levelOverview');
    for (let type of Object.keys(storedState.achievements)) {
        const levelList = levelOverview.querySelector(`.${type} .levels`);
        removeAllChildren(levelList);
        for (let i = 1; i <= storedState.achievements[type]; i++) {
            const a = newElem('a', {href: '#', 'data-level-number': i.toString()}, newTxt(i.toString()));
            a.classList.add('levelLink');
            levelList.append(a);
            levelList.append(newTxt(' '));
            a.addEventListener('click', selectLevel);
        }
    }
}

function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function createTask(): void {
    const level = LEVELS[levelType][(currentLevel-1) % LEVELS[levelType].length];

    if (level.op == '*' || level.op == '/') {
        const x = Math.floor(Math.random() * (level.minNumberRange[1]-level.minNumberRange[0])) + level.minNumberRange[0];
        const y = Math.floor(Math.random() * (level.maxNumberRange[1]-level.maxNumberRange[0])) + level.maxNumberRange[0];
        if (level.op == '*') {
            const task = Math.random() < 0.5 ? `${x} x ${y} =` : `${y} x ${x} =`;
            if (task == currentTask)
                return createTask();
            currentTask = task;
            currentResult = currentHint = `${x * y}`;
        }
        else {
            const r = x*y;
            const useY = Math.random() < 0.5;
            const task = useY ? `${r} : ${y} =` : `${r} : ${x} =`;
            if (task == currentTask)
                return createTask();
            currentTask = task;
            currentResult = currentHint = useY ? `${x}` : `${y}`;
        }
        taskStartTime = undefined;
        showHint = false;
    }
    else
        throw new Error('Unknown operation ' + level.op);
}

function play(): void {
    state = GameState.Play;
    progress = displayedProgress = turtleVelocity = 0;

    createTask();
}

function enterResult(): void {
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

function handleKeyPress(e: KeyboardEvent): boolean {
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
        const digit = e.key.charCodeAt(0) - 48;
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

function progressToX(p: number, e: HTMLElement): number {
    return 10 + Math.max(0, Math.min(p, 100))/100 * 
        (document.getElementById('sea').offsetWidth - e.offsetWidth - 10);
}

function gameLogic(time: DOMHighResTimeStamp, d: number): void {
    const level = LEVELS[levelType][(currentLevel-1) % LEVELS[levelType].length];
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

    if (!resultStateStart)
        resultStateStart = time;
    if ((time - resultStateStart) / 1000 > 0.6 && resultState != ResultState.Input) {
        resultState = ResultState.Input;
        resultStateStart = time;
        inputShake = 0;
        currentInput = '';
    }
    else if (resultState == ResultState.Bad)
        inputShake = Math.sin(time / 20)*10;
    else
        inputShake = 0;
    
    toShowInput = (resultState == ResultState.Input || resultState == ResultState.Good) ? (currentInput || '?') : (currentInput || toShowInput);
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
    document.getElementById('task').style.paddingLeft = `${inputShake}px`;
}

function nextLevel(level?: number) {
    state = GameState.NextLevel;
    currentLevel = level || (currentLevel+1);
    nextLevelStartTime = undefined;

    if (level) {
        newShells = [];
        for (let i = 1; i < currentLevel; i++) {
            const newShell = document.createElement('img');
            newShell.src = 'assets/shell-1.svg';
            newShell.classList.add('sprite');
            newShell.classList.add('shell');
            newShell.style.top = '0';
            newShell.style.right = `${35 * i - 25}px`;
            document.getElementById('sea').appendChild(newShell);
            newShells.push(newShell);
        }
    }
    else {
        const newShell = document.createElement('img');
        newShell.src = 'assets/shell-1.svg';
        newShell.classList.add('sprite');
        newShell.classList.add('shell');
        newShell.style.top = '0';
        newShell.style.right = `${35 * currentLevel - 25}px`;
        newShells = [newShell];
        document.getElementById('sea').appendChild(newShell);
    }

    document.getElementById('levelOverlayContent').innerText = `Level ${currentLevel}`;
    document.getElementById('levelOverlay').style.display = undefined;

    if (!level && storedState.achievements[levelType] < currentLevel) {
        storedState.achievements[levelType] = currentLevel;
        storeState();
        updateLevelSelector();
    }
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
    newShells.forEach(it=>it.style.top = `${-75 + easeInOutCubic(passed) * 75}px`);
    
    if (passed < 0.2)
        document.getElementById('levelOverlay').style.opacity = `${passed/0.2}`;
    else if (passed > 0.8)
        document.getElementById('levelOverlay').style.opacity = `${1-(passed-0.8)/0.2}`;
    else
        document.getElementById('levelOverlay').style.opacity = '1';
    document.getElementById('levelOverlay').style.display = 'block';
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
    createTask();
    updateLevelSelector();
}

document.addEventListener('DOMContentLoaded', init);
window.requestAnimationFrame(animate);
document.addEventListener("keydown", handleKeyPress);
play();




