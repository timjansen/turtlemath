let progress = 0;          // 0-100
let displayedProgress = 0; // 0-100
let turtleVelocity = 0;
let currentResult;
const TIME_TO_LOSE_PROGRESS = 0.01; // in seconds
const PROGRESS_TO_LOSE_PER_SECOND = 1;
let lastLoss = 0;

function getTask(): [string,string] {
    const x = Math.floor(Math.random() * 9.99) + 1;
    const y = Math.floor(Math.random() * 9.99) + 1;
    return [`${x} x ${y} =`, `${x * y}`];
}

function showTask(): void {
    const [question, result] = getTask();
    document.getElementById('question').innerText = question;
    document.getElementById('answer').innerText = '?';
    currentResult = result;
}

function enterResult(): void {
    if (parseInt(document.getElementById('answer').textContent) == currentResult) {
        progress = Math.min(100, progress + 5);
        if (progress >= 100)
            document.getElementById('star').classList.add('win');
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
    else if (e.code == 'Enter') {
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
        if (parseInt(a.textContent) == currentResult)
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
    const losingTime = (time - lastLoss)/1000;
    if (losingTime > TIME_TO_LOSE_PROGRESS && progress < 100) {
        progress = Math.max(0, progress - losingTime*PROGRESS_TO_LOSE_PER_SECOND);
        lastLoss = time;
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
    star.style.top = `${50+(5*Math.cos(time/1005))}px`;
    star.style.left = `${progressToX(100, star)+(5*Math.cos(time/2071))}px`;
    star.style.transform = `rotate(${6*Math.cos(Math.PI+time/606)}deg)`;
}



let lastAnimate = 0;
function animate(time: DOMHighResTimeStamp): void {
    const d = time - lastAnimate;
    gameLogic(time, d);
    gameAnimate(time, d);
    gameRender(time, d);

    window.requestAnimationFrame(animate);
}

window.addEventListener('DOMContentLoaded', () => {
    document.addEventListener("keydown", handleKeyPress);
    showTask();
});

window.requestAnimationFrame(animate);
