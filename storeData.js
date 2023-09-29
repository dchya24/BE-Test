const axios = require("axios");
const db = require("./app/models");

const fetchData = async() => {
    const api = "https://livethreatmap.radware.com/api/map/attacks?limit=10";

    const response = await axios.get(api);

   const data = response.data;

   let values = [];

   data.forEach((items) => {
    items.forEach((item) => {
        values.push(`('${item.sourceCountry}', '${item.destinationCountry}', '${item.millisecond}', '${item.type}', '${item.weight}', '${item.attackTime}')`)
    });
   })

   const query = `INSERT INTO livethreatmap("sourcecountry", "destinationcountry", "millisecond", "type", "weight", "attacktime") VALUES ${values.join(",")}`;

   await db.sequelize.query(query);
}

fetchData();