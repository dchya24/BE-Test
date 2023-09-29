const { default: axios } = require("axios");
const db = require("../models");
const { WebSocket } = require("ws");
const { redisClient } = require("../shared/redis");

/**
 * Dengan asumsi fungsi ini adalah mendapatkan average nilai per-pertanyaan,
 * Maka fungsi ini mengolah data scores dari table survey yang berupa array.
 */
exports.refactoreMe1 = async (req, res) => {
  // function ini sebenarnya adalah hasil survey dri beberapa pertnayaan, yang mana nilai dri jawaban tsb akan di store pada array seperti yang ada di dataset
  try{
    const query = await db.sequelize.query(`select values as scores from surveys`);
    const result = query[0];

    // Tranpose data from n x m to m x n
    let transposedData = result[0].scores.map((col, i) => result.map((row) => row.scores[i]))

    let avgScores = [];
    transposedData.forEach((data) => {
      var score = 0;
      var scores = data;
      
      scores.forEach((data) => {
        score = score + data;
      })
      avgScores.push(Math.floor(score / scores.length));
    })


    res.status(200).json({
      statusCode: 200,
      success: true,
      data: avgScores
    });
    
  }
  catch(err){
    console.error(err);
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: 'Something wrong in server!'
    });
  }
};

exports.refactoreMe2 = async (req, res) => {
  const t = await db.sequelize.transaction();
  try{
      // function ini untuk menjalakan query sql insert dan mengupdate field "dosurvey" yang ada di table user menjadi true, jika melihat data yang di berikan, salah satu usernnya memiliki dosurvey dengan data false
    const { userId, values } = req.body;

    const arrValues = values.split(",");

    await db.sequelize.query(`INSERT INTO surveys("values", "userId", "createdAt", "updatedAt") VALUES($1, $2, now(), now())`, {
      bind: [arrValues, userId]
    });

    await db.sequelize.query(`UPDATE users set dosurvey=true, "updatedAt"=now() where id=$1`, {
      bind: [userId]
    });

    await t.commit();

    res.status(201).json({
      statusCode: 201,
      message: "Survey sent successfully!",
      success: true,
    });
  }
  catch(err){
    await t.rollback();
    console.error(err);
    res.status(500).json({
      statusCode: 500,
      message: "Cannot post survey.",
      success: false,
    });
  };
}

exports.callmeWebSocket =  async (wss) => {
  const api = "https://livethreatmap.radware.com/api/map/attacks?limit=10";

  const response = await axios.get(api);
  
  wss.clients.forEach((client) => {
    if(client.readyState == WebSocket.OPEN){
      client.send(JSON.stringify(response.data));
    }
  })
};

exports.getData = async (req, res) => {
  let data; 
    
  const cache = await redisClient.get("livethreatmap");

  if(cache){
    data = JSON.parse(cache);
  }
  else{
    const destinationCountry = await db.sequelize.query("select count(distinct destinationcountry)as destinationcountry  from livethreatmap");

    const sourceCountry = await db.sequelize.query("select count(distinct sourcecountry) as sourcecountry  from livethreatmap");

    data = {
      label: ['sourceCountry', 'destinationCountry'],
      total: [sourceCountry[0][0].sourcecountry, destinationCountry[0][0].destinationcountry]
    };

    await redisClient.set("livethreatmap", JSON.stringify(data));
  }

  res.status(200).json({
    statusCode: 200,
    success: true,
    data: data
  });
};
