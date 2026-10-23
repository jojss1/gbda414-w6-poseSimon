/*
WEEK 6 WORKSHOP: POSE SIMON SAYS

FULL SKETCH — STUDENT IN-CLASS ACTIVITY

This is the base version of the project. It gives a prompt, watches for the
requested pose during the prompt, and then displays feedback.

YOUR TASK:
Change the confirmation and rejection feedback. You must change both:
1. the text shown for compliance and non-compliance; and
2. optionally, a visual property such as colour, shape, motion, or layout.

Changing the two message strings satisfies the coding task. Make them
easy to understand.

Examples:
- "GOOD HUMAN. COMPLIANCE RECORDED." versus "DEVIATION LOGGED."
- A green expanding circle versus a red shaking rectangle.
- A friendly message versus a bureaucratic machine message.

The working project must be published to GitHub Pages.
*/

let video;
let bodyPose;
let poses = [];
let lastPoseTime = -10000;

let currentState = "WAITING";
let currentPrompt = null;
let stateStartTime = 0;

let actionDetected = false;
let roundCorrect = false;
let nextSimonSays = true;

const WAIT_TIME = 1500;
const PROMPT_TIME = 4000;
const RESULT_TIME = 2500;

const prompts = [
  { text: "Raise your left hand", action: "leftHandUp" },
  { text: "Raise your right hand", action: "rightHandUp" },
  { text: "Raise both hands", action: "bothHandsUp" },
];

function preload() {
  bodyPose = ml5.bodyPose({ flipped: true });
}

function setup() {
  createCanvas(640, 480);

  video = createCapture(VIDEO, { flipped: true });
  video.size(width, height);
  video.hide();

  bodyPose.detectStart(video, gotPoses);

  stateStartTime = millis();
}

function gotPoses(results) {
  poses = results;
  lastPoseTime = millis();
}

function draw() {
  background(20);
  image(video, 0, 0);
  updateStateMachine();
  drawSkeleton();
  drawInterface();
}

function updateStateMachine() {
  let elapsed = millis() - stateStartTime;

  if (currentState === "WAITING") {
    if (elapsed > WAIT_TIME) {
      chooseNewPrompt();
    }
  } else if (currentState === "PROMPTING") {
    if (checkAction(currentPrompt.action)) {
      actionDetected = true;
    }

    if (elapsed > PROMPT_TIME) {
      roundCorrect = currentPrompt.simonSays ? actionDetected : !actionDetected;
      currentState = "RESULT";
      stateStartTime = millis();
    }
  } else if (currentState === "RESULT") {
    if (elapsed > RESULT_TIME) {
      currentState = "WAITING";
      stateStartTime = millis();
    }
  }
}

function chooseNewPrompt() {
  let index = floor(random(prompts.length));
  currentPrompt = { ...prompts[index], simonSays: nextSimonSays };
  nextSimonSays = !nextSimonSays;
  currentPrompt.text =
    (currentPrompt.simonSays ? "Simon says: " : "") + currentPrompt.text;

  actionDetected = false;
  currentState = "PROMPTING";
  stateStartTime = millis();
}

function leftHandUp() {
  let pose = getCurrentPose();
  if (!pose) return false;

  let wrist = pose.left_wrist;
  let shoulder = pose.left_shoulder;

  if (!wrist || !shoulder) return false;
  if (wrist.confidence < 0.3 || shoulder.confidence < 0.3) return false;

  return wrist.y < shoulder.y;
}

function rightHandUp() {
  let pose = getCurrentPose();
  if (!pose) return false;

  let wrist = pose.right_wrist;
  let shoulder = pose.right_shoulder;

  if (!wrist || !shoulder) return false;
  if (wrist.confidence < 0.3 || shoulder.confidence < 0.3) return false;

  return wrist.y < shoulder.y;
}

function bothHandsUp() {
  return leftHandUp() && rightHandUp();
}

function checkAction(actionName) {
  if (actionName === "leftHandUp") return leftHandUp();
  if (actionName === "rightHandUp") return rightHandUp();
  if (actionName === "bothHandsUp") return bothHandsUp();
  return false;
}

function getCurrentPose() {
  if (poses.length === 0 || millis() - lastPoseTime > 700) return null;
  return poses[0];
}

function drawSkeleton() {
  if (
    poses.length === 0 ||
    video.elt.videoWidth === 0 ||
    video.elt.videoHeight === 0
  )
    return;

  let pose = poses[0];

  noStroke();
  fill(0, 255, 180);
  for (let keypoint of pose.keypoints) {
    if (keypoint.confidence > 0.3) {
      circle(width - keypoint.x, keypoint.y, 10);
    }
  }

  stroke(0, 255, 180);
  strokeWeight(4);
  drawLimb(pose.left_shoulder, pose.left_elbow);
  drawLimb(pose.left_elbow, pose.left_wrist);
  drawLimb(pose.right_shoulder, pose.right_elbow);
  drawLimb(pose.right_elbow, pose.right_wrist);
  drawLimb(pose.left_shoulder, pose.right_shoulder);
  noStroke();
}

function drawLimb(pointA, pointB) {
  if (!pointA || !pointB) return;
  if (pointA.confidence < 0.3 || pointB.confidence < 0.3) return;
  line(width - pointA.x, pointA.y, width - pointB.x, pointB.y);
}

function drawInterface() {
  noStroke();

  if (currentState === "WAITING") {
    drawPanel("POSE SIMON SAYS", "Get ready. A prompt is coming.");
  } else if (currentState === "PROMPTING") {
    drawPanel("PROMPT", currentPrompt.text);
    drawTimer();
  } else if (currentState === "RESULT") {
    drawFeedback();
  }
}

function drawPanel(title, message) {
  fill(0, 190);
  rect(20, 20, width - 40, 160, 14);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(20);
  text(title, width / 2, 55);
  textSize(29);
  text(message, 45, 90, width - 90, 78);
}

function drawTimer() {
  let elapsed = millis() - stateStartTime;
  let remaining = constrain(1 - elapsed / PROMPT_TIME, 0, 1);

  noFill();
  stroke(255);
  strokeWeight(8);
  arc(width / 2, 250, 90, 90, -HALF_PI, -HALF_PI + TWO_PI * remaining);
  noStroke();
}

function drawFeedback() {
  fill(0, 190);
  rect(20, 20, width - 40, 220, 14);
  textAlign(CENTER, CENTER);
  if (roundCorrect) {
    fill(120, 255, 160);
    textSize(34);
    text("NICE WORK!", width / 2, 75);
    fill(255);
    textSize(18);
    text(
      currentPrompt.simonSays ? "You followed Simon!" : "You waited for Simon!",
      width / 2,
      145,
    );
  } else {
    fill(255, 130, 130);
    textSize(34);
    text("OOPS! TRY AGAIN", width / 2, 75);
    fill(255);
    textSize(18);
    text(
      currentPrompt.simonSays
        ? "Simon asked you to move!"
        : "Simon did not say to move!",
      width / 2,
      145,
    );
  }
  fill(255);
  textSize(15);
  text("Prompt: " + currentPrompt.text, 45, 175, width - 90, 58);
}
