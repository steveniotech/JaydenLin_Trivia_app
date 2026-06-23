// Get questions function
let questionCache = [];
let playButton = document.getElementById("play");
let hs = 0;
let ans = [
  document.getElementById("ag1"),
  document.getElementById("ag2"),
  document.getElementById("ag3"),
  document.getElementById("ag4"),
];
let answered = false;
let inAQuestion = false;
let ansgrid = document.getElementById("ansgrid");
let qid = document.getElementById("question");
let questionsDone = 0;
let score = 0;
let totalTime = 0;
let timeLeft = 15;
let difficulty = "hard";
let sessionAnswers = [];
let sessionQuestions = [];
let categorySelect = document.getElementById("categorySelect");
let category = 0;
function shuffle(array) {
  let n = array.length;
  while (n > 1) {
    const randomIndex = Math.floor(Math.random() * n);
    n--;
    [array[n], array[randomIndex]] = [array[randomIndex], array[n]];
  }
  return array;
}
async function fetchQuestions() {
  let base = `https://opentdb.com/api.php?amount=10&encode=base64&difficulty=${difficulty}`;
  let addon1 = `&category=${category}`;
  console.log(category == "any", category != "any");
  if (category != "any") {
    base = base + addon1;
  }
  console.log(base);
  let res = await fetch(base);
  let q = await res.json();
  console.log(q.results);
  q.results.forEach((element) => {
    questionCache.push(element);
  });
}
function sendError(msg) {
  document.getElementById("errorDisplay").style.display = "block";
  document.getElementById("errorDisplay").innerHTML = "Error: " + msg;
}
function sendNotify(msg, duration = 2.5) {
  let newNotification = document.createElement("p");
  newNotification.innerText = msg;
  newNotification.className = "notification";
  newNotification.style.opacity = 1;
  document.getElementById("notifications").appendChild(newNotification);
  let opacitySmooth = setInterval(() => {
    newNotification.style.opacity -= 1 / 5;
    console.log("still running");
  }, (duration * 1000) / 5);
  setTimeout(() => {
    newNotification.remove();
    clearInterval(opacitySmooth);
  }, duration * 1000);
}
async function fade(elements, duration = 2.5, upd = 0.05, start = 1, end = 0) {
  elements.forEach((ele) => {
    ele.style.opacity = start;
  });
  let tick = (start - end) * (upd / duration);
  console.log(tick);
  for (let ind = 0; ind < duration / upd; ind++) {
    console.log("Running")
    elements.forEach((ele) => {
      ele.style.opacity -= tick;
    });
    await new Promise((res) => setTimeout(res, upd * 1000));
  }
  elements.forEach((ele) => {
    ele.style.opacity = end;
  });
  return "done";
}
async function loadQuestion() {
  try {
    inAQuestion = true;
    answered = false;
    questionsDone++;
    let selectedQuestion = questionCache[0];
    let readableQuestion = atob(selectedQuestion.question);
    sessionQuestions.push(readableQuestion);
    let correct = selectedQuestion.correct_answer;
    let incorrectAnswers = selectedQuestion.incorrect_answers;
    let allAnswers = incorrectAnswers;
    allAnswers.push(correct);
    allAnswers = shuffle(allAnswers);
    //console.log(allAnswers);
    let i = 0;
    let correcti = 0;
    qid.innerText = readableQuestion;
    let timeThen = performance.now();
    for (i = 0; i < 4; i++) {
      let pe = ans[i].parentElement;
      let v = allAnswers[i];
      if (v == correct) {
        correcti = i;
      }
      if (!v) {
        console.log("A");
        ans[i].innerText = "";
        pe.style.display = "none";
      } else {
        //console.log(v);
        pe.style.display = "block";
        pe.style.backgroundColor = "";
        //console.log(i);
        ans[i].innerText = atob(v);
      }
      ans[i].onclick = async () => {
        if (answered) {
          return;
        }
        inAQuestion = false;
        let timeNow = performance.now();
        let timeToFinishQuestion = timeNow - timeThen;
        timeToFinishQuestion /= 1000;
        totalTime += timeToFinishQuestion;
        console.log(
          "Player finished question in " + timeToFinishQuestion + "s"
        );
        playButton.innerText = "Next";
        ans.forEach((ansText, ind) => {
          if (correcti == ind) {
            ansText.parentElement.style.backgroundColor = "rgb(50,255,50)";
          } else {
            ansText.parentElement.style.backgroundColor = "rgb(255,50,50)";
          }
        });

        answered = true;
        let newText = document.createElement("p");
        newText.id = Math.random() + "notification1";
        newText.style.fontSize = "16px";
        newText.style.alignSelf = "center";
        newText.style.position = "absolute";
        document.getElementById("score").innerHTML =
          "score: " +
          Math.round(score) +
          " questions done: " +
          Math.round(questionsDone);
        document.body.appendChild(newText);
        sessionAnswers.push([
          v == correct,
          atob(correct),
          atob(v),
          readableQuestion,
        ]);
        if (v == correct) {
          let addScore = 1000 / (timeToFinishQuestion / 5) ** 0.5;
          if (timeLeft <= 0) {
            addScore = 0;
          }
          timeLeft = 15;
          sendNotify("Player answered correctly. Points awarded: " + addScore);
          score += addScore;
          document.getElementById("score").innerHTML =
            "score: " +
            Math.round(score) +
            " questions done: " +
            Math.round(questionsDone);
          newText.innerText = "Correct. " + "+" + Math.round(addScore);
          for (i = 0; i < 500; i++) {
            newText.style.top = 500 - i + "px";
            await new Promise((res) => setTimeout(res, 2));
          }
          newText.remove();
        } else {
        }
        timeLeft = 15;
      };
    }
    // remove from cache
    questionCache.shift();
  } catch (err) {
    sendError(err);
  }
}
let startGame = true;
let ansParents = [
  ans[0].parentElement,
  ans[1].parentElement,
  ans[2].parentElement,
  ans[3].parentElement,
]
playButton.onclick = async () => {
  try {
    if (answered && questionCache.length > 0) {
      answered = false;
      await fade(ansParents, 0.2, 1/60, 1, 0);
      await loadQuestion();
      await fade(ansParents, 0.2, 1/60  , 0, 1);
      startGame = false;
      return;
    }
    if (startGame) {
      document.getElementById("ansgrid").style.display = "grid";
      sessionAnswers = [];
      sessionQuestions = [];
      category = categorySelect.value;
      console.log(category);
      document.getElementById("allAnswers").innerHTML = "";
      playButton.style.zIndex = 1;
      document.getElementById("win").style.display = "none";
      if (questionCache.length <= 0) {
        await fetchQuestions();
        await loadQuestion();
      }
      return;
    }
    if (questionCache.length <= 0) {
      document.getElementById("win").style.display = "block";
      if (score > hs) {
        document.getElementById("win1").innerText =
          "New High Score! Finished in " + totalTime.toFixed(3) + "s.";
        hs = score;
      } else {
        document.getElementById("win1").innerText =
          "Finished in " + totalTime.toFixed(3) + "s.";
      }
      // animate score
      let savedScore = score + 0;
      let savedHighScore = hs + 0;
      if (savedHighScore > localStorage.getItem("hs_trivia_game")) {
        localStorage.setItem("hs_trivia_game", savedHighScore);
      }

      score = 0;
      hs = 0;
      for (i = 0; i < 100; i++) {
        score += savedScore / 100;
        hs += savedHighScore / 100;
        document.getElementById("winsc").innerText =
          "score: " + Math.round(score);
        document.getElementById("winhsc").innerText =
          "session high score: " + Math.round(hs);
        document.getElementById(
          "winathsc"
        ).innerText = `all time high score: ${localStorage.getItem(
          "hs_trivia_game"
        )}`;
        await new Promise((res) => setTimeout(res, 10));
      }
      //allAnswers
      sessionAnswers.forEach((sessionAnswer, sessionIndex) => {
        let questionNumber = sessionIndex + 1;
        let questionText = sessionAnswer[3];
        let yourAnswer = sessionAnswer[1];
        let correctAnswer = sessionAnswer[2];
        let result = sessionAnswer[0];
        if (result) {
          result = "Correct";
        } else {
          result = "Wrong";
        }
        let containerDiv = document.createElement("div");
        let t1 = document.createElement("h2"); // question goes here
        let t2 = document.createElement("h3"); // your answer goes here
        let t3 = document.createElement("h3"); // correct answer goes here
        let t4 = document.createElement("h3"); // result goes here
        t1.innerText = "Q" + questionNumber + ": " + questionText;
        t2.innerText = "Your answer: " + yourAnswer;
        t3.innerText = "Correct answer: " + correctAnswer;
        t4.innerText = "Result: " + result;
        containerDiv.append(t1, t2, t3, t4);
        document.getElementById("allAnswers").appendChild(containerDiv);
      });
      timeLeft = 15;
      score = 0;
      playButton.innerText = "Play Again";
      playButton.style.zIndex = 2;
      startGame = true;
    }
  } catch (err) {
    sendError(err);
  }
};
document.getElementById("otherGameModes").onchange = () => {
  difficulty = document.getElementById("otherGameModes").value;
};
let timeNotifySent = false;
setInterval(() => {
  if (inAQuestion) {
    timeLeft = Math.max(0, timeLeft - 1);
    if (timeLeft == 0 && !timeNotifySent) {
      sendNotify("Time used. No score will be awarded.");
      timeNotifySent = true;
    } else if (timeLeft > 0) {
      timeNotifySent = false;
    }
    document.getElementById("timeLeft").innerHTML = timeLeft.toFixed(1) + "s";
  }
}, 1000);
/*
document.body.innerHTML = `
 <style>
   #app {
     max-width: 500px;
     margin: auto;
     background: white;
     padding: 20px 30px;
     border-radius: 12px;
     box-shadow: 0 4px 8px rgba(0,0,0,0.1);
   }

   h1 {
     text-align: center;
     margin-bottom: 20px;
   }

   #errorBox {
     background: #ffdddd;
     color: #cc0000;
     padding: 12px;
     margin-top: 15px;
     border-radius: 8px;
     display: none;
     font-weight: bold;
   }

   #startBtn {
     background: #4a90e2;
     border: none;
     color: white;
     padding: 10px 18px;
     border-radius: 8px;
     cursor: pointer;
     font-size: 16px;
   }

   #startBtn:hover {
     background: #357ac8;
   }
 </style>

 <div id="app">
   <h1>Debugging Challenge</h1>

   <label for="categorySelect">Choose Category:</label><br>
   <select id="categorySelect">
     <option value="9">General Knowledge</option>
     <option value="21">Sports</option>
     <option value="23">History</option>
   </select>

   <br><br>
   <button id="startBtn">Start Quiz</button>

   <div id="errorBox"></div>

   <div id="quizContainer" style="margin-top:20px;"></div>
 </div>
`;

function showError(message) {
  const box = document.getElementById("errorBox");
  box.style.display = "block";
  box.innerText = "DEBUGGING CHALLENGE ERROR: " + message;
}

async function fetchQuestions(categoryId) {
  try {
    let response = await fetch(
      `https://opentdb.com/api.php?amount=10&category=${categoryId}`
    );
    const data = await response.json();
    console.log(data.results);

    return data;
  } catch (err) {
    showError(err);
  }
}

document.getElementById("startBtn").addEventListener("click", () => {
  const category = document.getElementById("categorySelect").value;
  let categoryId = category;
  console.log(categoryId);
  try {
    fetchQuestions(categoryId);
  } catch (err) {
    showError(err);
  }
});
*/
