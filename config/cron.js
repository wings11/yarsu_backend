import cron from "cron";
import http from "http";
import https from "https";

const cjob = new cron.CronJob("*/14 * * * *", function () {
  const apiUrl = process.env.API_URL;
  
  if (!apiUrl) {
    console.log("API_URL not configured, skipping cron job");
    return;
  }
  
  console.log("Cron job running, pinging:", apiUrl);
  
  // Use http for localhost, https for external URLs
  const client = apiUrl.startsWith('https://') ? https : http;
  
  client
    .get(apiUrl, (res) => {
      if (res.statusCode === 200) {
        console.log("GET request sent successfully");
      } else {
        console.log("GET request failed", res.statusCode);
      }
    })
    .on("error", (e) => {
      console.error("Error while sending request", e.message);
    });
});

export default cjob;
