const http = require("http");
const socketIO = require("socket.io");
const mysql = require("mysql");
const cors = require('cors');  // Add this line
const port = 3076;
const express = require("express");
const app = express();

app.use(cors());

const server = http.createServer(app);
const io = socketIO(server,{
cors: {
    origin: "http://localhost:3000",  // Allow your client's origin
    methods: ["GET", "POST"],
    credentials: true
}
});

let crashPosition = 1;
let finalcrash = 0;
let fly;
let nxtcrash = 0;
let betamount = 0;
let clients = [];
let gameSessionActive = false;

// Establish MySQL database connection
const db_config = {
  host: "localhost",
  user: "sk1",
  password: "sk1",
  database: "sk1",
  keepAlive: true,
  port: 3304,
};

let connection;

function handleDisconnect() {
  connection = mysql.createConnection(db_config);

  connection.connect(function (err) {
    if (err) {
      console.log("Error when connecting to db:", err);
      setTimeout(handleDisconnect, 2000);
    }
  });

  connection.on("error", function (err) {
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

// crashstack function
function showCrashStack() {
  const queryCrashRecord = `SELECT id, crashpoint FROM crashgamerecord ORDER BY id DESC LIMIT 10`;
  connection.query(queryCrashRecord, (err, results) => {
    if (err) {
      console.error("Error fetching crash record:", err);
    } else {

      io.emit("showCrashStack", results); // Emit the correct event name
    }
  });
}
showCrashStack();



// Function for setting the crash logic
function setcrash() {
  const q14 = `SELECT crash FROM icrash WHERE id=1`;
  connection.query(q14, (err, result14) => {
    if (err) {
      console.error("Error fetching crash:", err);
    } else {
      const n14 = result14[0].crash;
      if (n14 > 0) {
        const q11 = `UPDATE icrash SET crash=0 WHERE id=1`;
        connection.query(q11, (err) => {
          if (err) {
            console.error("Error resetting crash:", err);
          }
        });
      }
    }
  });

  const query23 = `SELECT nxt FROM aviset WHERE id = 1`;
  connection.query(query23, (err, result) => {
    if (err) {
      console.error("Error fetching next crash:", err);
    } else {
      nxtcrash = result[0].nxt;
      if (nxtcrash == 0) {
        io.emit("gameState", {
          status: "playing",
          currentMultiplier: crashPosition,
        });
        const query9 = `SELECT SUM(amount) AS total, COUNT(*) AS betCount FROM crashbetrecord WHERE status = 'pending'`;
        connection.query(query9, (err, result) => {
          if (err) {
            console.error("Error fetching bet total:", err);
          } else {
            betamount = result[0].total || 0;
            const betCount = result[0].betCount;

            if (betamount == 0) {
              finalcrash = (Math.random() * 6 + 1).toFixed(2);
              repeatupdate(200);
            } else if (betCount == 1 || betCount == 2) {
              finalcrash = (Math.random() * 0.2 + 1).toFixed(2);
              repeatupdate(200);
            } else if (betamount <= 100) {
              finalcrash = (Math.random() * 0.2 + 1).toFixed(2);
              repeatupdate(300);
            } else {
              finalcrash = (Math.random() * 0.9 + 1).toFixed(2);
              repeatupdate(200);
            }
          }
        });
      } else {
        finalcrash = parseFloat(nxtcrash);
        repeatupdate(200);
        const query36 = `UPDATE aviset SET nxt = 0 WHERE id = 1`;
        connection.query(query36, (err) => {
          if (err) {
            console.error("Error resetting next crash:", err);
          }
        });
      }
    }
  });
}

// Restart the plane when crash happens
function restartplane() {
  clearInterval(fly);
  if (!gameSessionActive) {
    console.error("crashposition= ", crashPosition);
    const query5 = `INSERT INTO crashgamerecord (crashpoint) VALUES ('${crashPosition}')`;
    connection.query(query5, (err) => {
      if (err) {
        console.error("Error adding record to database:", err);
      }
    });

    io.emit("updatehistory", crashPosition);
    io.emit("gameState", {
      status: "crashed",
      currentMultiplier: crashPosition,
    });
    gameSessionActive = true; // Mark game session as active
  }

  setTimeout(() => {
    console.error("restarttime= ", crashPosition);
    const query4 = `UPDATE crashbetrecord SET status = 'fail', winpoint='${crashPosition}' WHERE status = 'pending'`;
    connection.query(query4, (err) => {
      if (err) {
        console.error("Error updating bet records:", err);
      }
    });
    io.volatile.emit("reset", "resetting plane.....");
  }, 200);

  setTimeout(() => {
    io.emit("gameState", { status: "waiting", currentMultiplier: 1 });
    setTimeout(() => {
      io.emit("prepareplane");
      crashPosition = 0.99;
      io.emit("flyplane");
      setTimeout(() => {
        setcrash();
        gameSessionActive = false; // Reset game session status

      }, 1000);
    }, 5000);
  }, 5000);
}

// Fetch crash updates and emit them
function updateCrashInfo() {
  const q13 = `SELECT crash FROM icrash WHERE id=1`;
  connection.query(q13, (err, result13) => {
    if (err) {
      console.error("Error fetching crash:", err);
    } else {
      const n13 = result13[0].crash;
      if (n13 == 1) {
        finalcrash = crashPosition;
      }

      const fc = parseFloat(finalcrash);
      const cp = parseFloat(crashPosition);

      if (fc > cp) {
        crashPosition = (parseFloat(crashPosition) + 0.01).toFixed(2);
        io.emit("crash-update", crashPosition);
        showCrashStack();


        if (nxtcrash == 0) {
          calculatePotentialProfitAndPercentage();
        }
      } else {
        restartplane();
      }
    }
  });
}

// Function to calculate potential profit for users
function calculatePotentialProfitAndPercentage() {
  const query = `SELECT username, amount FROM crashbetrecord WHERE status = 'pending'`;
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching bet records:", err);
    } else {
      let totalProfit = 0;
      let userProfits = {};
      results.forEach((record) => {
        const { username, amount } = record;
        const winamount = (amount * crashPosition * 0.98).toFixed(2);
        const profit = (winamount - amount).toFixed(2);
        totalProfit += parseFloat(profit);

        if (!userProfits[username]) {
          userProfits[username] = 0;
        }
        userProfits[username] += parseFloat(profit);
      });

      const activeUsers = Object.keys(userProfits);

      if (activeUsers.length > 1) {
        const profitPercentage = ((totalProfit / betamount) * 100).toFixed(2);
        if (profitPercentage > 70) {
          finalcrash = crashPosition;
          io.emit("crash-update", crashPosition);
          restartplane();
          return;
        }
      }

      if (activeUsers.length === 1 && crashPosition >= 1.2) {
        finalcrash = crashPosition;
        io.emit("crash-update", crashPosition);
        restartplane();
      }
    }
  });
}

// Repeat crash updates periodically
function repeatupdate(duration) {
  clearInterval(fly); // Clear any existing interval to prevent overlap
  fly = setInterval(updateCrashInfo, duration);
}

// Socket.IO connection handling
io.on("connection", (socket) => {
  clients.push({ socketId: socket.id, username: null});
  socket.emit("working", "ACTIVE...!");

  socket.emit("gameState", {
    status: gameSessionActive ? "playing" : "waiting",
    currentMultiplier: crashPosition,
  });
  showCrashStack();

  socket.on("disconnect", () => {
    clients = clients.filter((client) => client.socketId !== socket.id);
    clearInterval(intervalId); // Clear leaderboard interval on disconnect
  });

  // Handle user validation based on username
  socket.on("validateUser", (username, callback) => {
    const query = `SELECT username, balance FROM users WHERE username = '${username}'`;
    connection.query(query, (err, result) => {
      if (err) {
        console.error("Error fetching user:", err);
        callback({ error: "Error fetching user data" });
      } else if (result.length > 0) {
        const userData = {
          username: result[0].username,
          balance: result[0].balance,
        };
        callback({ success: true, userData });
      } else {
        callback({ success: false, error: "User not found" });
      }
    });
  });
  // Send leaderboard on new connection

  function updateLeaderboard() {
    const leaderboardQuery = `
      SELECT username AS player, winpoint AS cashOut, amount, 
             (amount * winpoint * 0.98 - amount) AS profit, 
             'US' AS country, amount AS usdValue
      FROM crashbetrecord 
      WHERE status = 'success'
      ORDER BY profit DESC
      LIMIT 10;
    `;
  
    connection.query(leaderboardQuery, (err, results) => {
      if (err) {
        console.error("Error fetching leaderboard:", err);
      } else {
        io.emit("updateLeaderboard", results); // Emit leaderboard data
      }
    });
  }

  socket.on("newBet", (username, amount, callback) => {
    console.log("newBet received: ", username, " ", amount);
    const bal = `SELECT balance FROM users WHERE username = '${username}'`;

    connection.query(bal, (err, result) => {
      if (err) {
        console.error("Error fetching balance:", err);
        callback({ success: false, error: "Error fetching balance" }); // Send error response
      } else if (result.length === 0 || result[0].balance < amount) {
        console.log("Insufficient balance for: ", username);
        callback({ success: false, error: "Insufficient balance" }); // Send error response
      } else {
        // Deduct balance
        const query1 = `UPDATE users SET balance = balance - ${amount} WHERE username = '${username}'`;
        connection.query(query1, (err) => {
          if (err) {
            console.error("Error updating balance:", err);
            callback({ success: false, error: "Error updating balance" }); // Send error response
          } else {
            // Add bet record
            const query2 = `INSERT INTO crashbetrecord (username, amount) VALUES ('${username}', ${amount})`;
            connection.query(query2, (err) => {
              if (err) {
                console.error("Error adding bet record:", err);
                callback({ success: false, error: "Error adding bet record" }); // Send error response
              } else {
                console.log("Bet placed successfully for ", username);
                callback({ success: true }); // Send success response

                // Emit events to the client as needed
                io.emit("bet-success", username, amount);
                io.emit("disableBetButton", { username });
              }
            });
          }
        });
      }
    });
  });

  // handle cashout
  socket.on("addWin", (username, amount, winpoint) => {
    console.log(username, " ", amount, " ", winpoint);
    const bets = `SELECT SUM(amount) AS bets FROM crashbetrecord WHERE status = 'pending' AND username = '${username}'`;
    connection.query(bets, (err, result) => {
      if (err) {
        console.error("Error fetching bet total:", err);
      } else {
        if (result[0].bets > 0) {
          console.log("winner");
          let winamount = parseFloat(((amount * 98) / 100) * winpoint);
          winamount = winamount.toFixed(2);
          console.log(winamount);
          const query2 = `UPDATE users SET balance = balance + ${winamount} WHERE username = '${username}'`;
          connection.query(query2, (err) => {
            if (err) {
              console.error("Error updating balance:", err);
            }
          });
          const query3 = `UPDATE crashbetrecord SET status = 'success', winpoint='${winpoint}' WHERE username = '${username}' AND status = 'pending'`;
          connection.query(query3, (err) => {
            if (err) {
              console.error("Error updating bet status:", err);
            }
          });
        }
      }
    });
  });

  updateLeaderboard();
  const intervalId = setInterval(() => {
    updateLeaderboard(); // Fetch and emit the latest leaderboard data every 5 seconds
  }, 5000);
});
setcrash();

server.listen(port, () => {
  console.log(`Server running at :${port}/`);
});