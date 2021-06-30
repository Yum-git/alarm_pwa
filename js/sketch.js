let video;
let pose;
let skeleton;

let leftShoulderXList = [];
let leftShoulderYList = [];
let leftShouldXAve;
let leftShouldYAve;

let rightShoulderXList = [];
let rightShoulderYList = [];
let rightShoulderXAve;
let rightShoulderYAve;

let leftShouldYMax = Number.MAX_SAFE_INTEGER;
let rightShouldYMax = Number.MAX_SAFE_INTEGER;

let squatCount = 0;
let squatBool = false;
let squatHold = false;

function setup(){
    let canvas = createCanvas(640, 480);
    canvas.parent('container');
    video = createCapture(VIDEO);
    video.hide();
    poseNet = ml5.poseNet(video, modelLoaded);

    poseNet.on('pose', (results) => {
        poseDraw(results);
    });
}

function modelLoaded(){
    console.log('PoseNet Ready');
}

function poseDraw(poses){
    if(poses.length > 0){
        pose = poses[0].pose;
        skeleton = poses[0].skeleton;
    }
}

function moveOutput(poseList){
    let output = document.getElementById("output");
    let outputList = [];
    outputList.push('<div style="color: aliceblue">');
    outputList.push(squatHold);
    outputList.push('</div>');
    outputList.push('<table class="table table-bordered table-sm oneLine"><tbody>')
    outputList.push('<thead><tr><th>Pose</th><th>X</th><th>Y</th><tr></thead>')
    for (let idx = 0; idx < poseList.length; idx++){
        let title = '<td>' + poseList[idx][0] + '</td>';
        let x = '<td>' + Math.trunc(poseList[idx][1]) + '</td>';
        let y = '<td>' + Math.trunc(poseList[idx][2]) + '</td>';

        let oneLine = '<tr>' + title + x + y + '</tr>';
        outputList.push(oneLine);
    }
    outputList.push('  </tbody></table>');
    let outputStr = outputList.join('');
    output.innerHTML = outputStr;
}


function shoulderOutput(){
    const leftShoulder = pose.leftShoulder;
    const rightShoulder = pose.rightShoulder;

    leftShoulderXList.push(Math.trunc(leftShoulder.x));
    leftShoulderYList.push(Math.trunc(leftShoulder.y));

    rightShoulderXList.push(Math.trunc(rightShoulder.x));
    rightShoulderYList.push(Math.trunc(rightShoulder.y));



    if(leftShoulderXList.length === 100){
        leftShouldXAve = leftShoulderXList.reduce((prev,current)=>prev + current,0) / leftShoulderXList.length;
        leftShoulderXList.shift();
    }
    if(leftShoulderYList.length === 100){
        leftShouldYAve = leftShoulderYList.reduce((prev,current)=>prev + current,0) / leftShoulderYList.length;
        if(!squatHold){
            leftShouldYMax = Math.min(leftShouldYAve, leftShouldYMax);
        }
        leftShoulderYList.shift();
    }
    if(rightShoulderXList.length === 100){
        rightShoulderXAve = rightShoulderXList.reduce((prev,current)=>prev + current,0) / rightShoulderXList.length;
        rightShoulderXList.shift();
    }
    if(rightShoulderYList.length === 100){
        rightShoulderYAve = rightShoulderYList.reduce((prev,current)=>prev + current,0) / rightShoulderYList.length;
        if(!squatHold){
            rightShouldYMax = Math.min(rightShoulderYAve, rightShouldYMax);
        }
        rightShoulderYList.shift();
    }

    if(squatHold && leftShouldYAve < leftShouldYMax && rightShoulderYAve < rightShouldYMax && squatBool === true){
        squatCount += 1;
        squatBool = false;
    }

    if(squatHold && leftShouldYAve > leftShouldYMax && rightShoulderYAve > rightShouldYMax && squatBool === false){
        squatBool = true;
    }
}

function wristCheck(){
    const rightWrist = pose.rightWrist;
    const rightX = Math.trunc(rightWrist.x);
    const rightY = Math.trunc(rightWrist.y);
    // 100, 380
    if(75 <= rightX && rightX <= 125 && 355 <= rightY && rightY <= 395 && !squatHold){
        console.log("reset");
        console.log(rightX, rightY);
        squatCount = 0;
        leftShouldYMax = Number.MAX_SAFE_INTEGER;
        rightShouldYMax = Number.MAX_SAFE_INTEGER;
    }

    const leftWrist = pose.leftWrist;
    const leftX = Math.trunc(leftWrist.x);
    const leftY = Math.trunc(leftWrist.y);
    // 540, 380
    if(515 <= leftX && leftX <= 565 && 355 <= leftY && leftY <= 405){
        console.log("hold");
        if(squatHold){
            squatHold = false;
            squatBool = false;
        }
        else {
            squatHold = true;
            squatBool = true;
        }
    }
}


function draw(){
    image(video, 0, 0);
    if(pose){
        let poseList = [];
        for(let idx = 0; idx < pose.keypoints.length; idx++){
            let x = pose.keypoints[idx].position.x;
            let y = pose.keypoints[idx].position.y;

            let point = pose.keypoints[idx].part;

            poseList.push([point, x, y])
            fill(255, 0, 0);
            ellipse(x, y, 8, 8);
        }

        for (let idx = 0; idx < skeleton.length; idx++){
            let a = skeleton[idx][0];
            let b = skeleton[idx][1];
            strokeWeight(2);
            stroke(255);
            line(a.position.x, a.position.y, b.position.x, b.position.y);
        }
        moveOutput(poseList);
        wristCheck();
        shoulderOutput();
        stroke(0, 153, 255); //　線の色
        line(0, leftShouldYMax, width, rightShouldYMax); // 横の位置(始点), 縦の位置(始点),　横の位置(終点), 縦の位置(終点)
        stroke(0, 0, 0); //　線の色
        ellipse(100, 380, 100, 100);
        fill(255);
        textSize(12);
        text("Start & Reset", 60, 385);

        ellipse(540, 380, 100, 100);
        fill(120);
        textSize(12);
        text("Hold", 525, 385);


        fill(255);
        textSize(60);
        if(squatCount < 10){
            text(squatCount, 320, 240);
        }
        else {
            text("Clear!!", 240, 240);
        }
    }

}