const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const amqp = require("amqplib/callback_api");

const app = express();
const port = 8089;

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://workdaniarthurwidodo:OjWHN87KEQ7t0K8i@cluster0.kxugpca.mongodb.net/melonku?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
const RABBITMQ_URL = "amqp://user:password@localhost:5672/melon_vhost";
const QUEUE = "melon_queue";

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});

// Define a simple schema and model
const MonitorSchema = new mongoose.Schema({
  deviceID: { type: String, required: true },
  suhu: { type: Number, required: true },
  tanggal: { type: Date },
  lembab: { type: Number, required: true },
  isAnomali: { type: Boolean, default: false },
  isView: { type: Boolean, default: false },
});

// User model
const Monitor = mongoose.model("Monitor", MonitorSchema);

// CRUD Routes

app.get("/tambah/:deviceID/:suhu/:lembab", async (req, res) => {
  // Connect to RabbitMQ
  amqp.connect(RABBITMQ_URL, (err, connection) => {
    if (err) {
      console.error("Failed to connect to RabbitMQ", err);
      process.exit(1);
    }

    console.log("Connected to RabbitMQ");

    // Create a channel
    connection.createChannel(async (err, channel) => {
      if (err) {
        console.error("Failed to create a channel", err);
        process.exit(1);
      }

      // Ensure the queue exists
      channel.assertQueue(QUEUE, { durable: true });
      let body = [
        {
          suhu: req.params.suhu,
          deviceID: req.params.deviceID,
          lembab: req.params.lembab,
          tanggal: new Date(),
        },
      ];

      //     // Send a message to the queue
      channel.sendToQueue(QUEUE, Buffer.from(body));
      console.log(`Sent: ${body}`);

      res.send(`Message sent: ${ JSON.stringify(body)}`);
      //   });

      // Start consuming messages
      console.log(`Waiting for messages in ${QUEUE}. To exit press CTRL+C`);
      channel.consume(QUEUE, (body) => {
        if (body !== null) {
          console.log(`Received: ${body}`);
          // Acknowledge the message
          channel.ack(body);
        }
      });

      await Monitor.create({
        suhu: req.params.suhu,
        deviceID: req.params.deviceID,
        lembab: req.params.lembab,
        tanggal: new Date(),
      });

      console.log("transaksi berhasil ke broker");
    });
  });
  //   try {
  //     if (req.params.deviceID) {
  //       let body = {
  //         suhu: req.params.suhu,
  //         deviceID: req.params.deviceID,
  //         lembab: req.params.lembab,
  //         tanggal: new Date(),
  //       };

  //       const data = await Monitor.create({
  //         suhu: req.params.suhu,
  //         deviceID: req.params.deviceID,
  //         lembab: req.params.lembab,
  //         tanggal: new Date(),
  //       });

  //       res.status(200);
  //       res.send({
  //         status: true,
  //         message: data,
  //       });
  //       res.end();
  //       console.log("transaksi berhasil ke broker");
  //     } else {
  //       res.status(500);
  //       res.send({
  //         status: false,
  //         message: "data tidak lengkap",
  //         error: req.param.deviceID,
  //       });
  //       res.end();
  //     }
  //   } catch (error) {
  //     res.status(500);
  //     res.send({
  //       status: false,
  //       message: "transaksi gagal",
  //       error: error,
  //     });
  //     res.end();
  //   }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
