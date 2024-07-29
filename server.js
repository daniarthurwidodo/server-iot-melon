const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 8089;

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://workdaniarthurwidodo:OjWHN87KEQ7t0K8i@cluster0.kxugpca.mongodb.net/melonku?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to MongoDB');
});

// Define a simple schema and model
const MonitorSchema = new mongoose.Schema({
    deviceID: {type: String, required: true},
    suhu: {type: Number, required: true},
    tanggal: {type: Date},
    lembab: {type: Number, required: true},
    isAnomali: {type: Boolean, default: false},
    isView: {type: Boolean, default: false}
})

// User model
const Monitor = mongoose.model('Monitor', MonitorSchema)

// CRUD Routes

// Create
app.post('/tambah/:deviceID/:suhu/:lembab', async (req, res) => {
    try {
        if (req.params.deviceID) {
          // let data = {
          //   suhu: req.params.suhu,
          //   deviceID: req.params.deviceID,
          //   lembab: req.params.lembab,
          //   tanggal: new Date(),
          // };
    
        const data =  await Monitor.create({
            suhu: req.params.suhu,
            deviceID: req.params.deviceID,
            lembab: req.params.lembab,
            tanggal: new Date(),
          });
    
          // send to message broker
          // const queue = "monitor";
          // const conn = await amqplib.connect(
          //   "amqps://kdtcfyod:eTJ4LSahQETvqpG73HlqcwNmQoTN_jmj@armadillo.rmq.cloudamqp.com/kdtcfyod"
          // );
    
          // Sender
          // const ch2 = await conn.createChannel();
          // var json = JSON.stringify(data);
          // ch2.sendToQueue(queue, Buffer.from(json));
    
          res.status(200);
          res.send({
            status: true,
            message: data,
          });
          res.end();
          console.log("transaksi berhasil ke broker");
        } else {
          res.status(500);
          res.send({
            status: false,
            message: "data tidak lengkap",
            error: req.param.deviceID,
          });
          res.end();
        }
      } catch (error) {
        res.status(500);
        res.send({
          status: false,
          message: "transaksi gagal",
          error: error,
        });
        res.end();
      }
});

// Read all
app.get('/items', async (req, res) => {
    try {
        const items = await Item.find();
        res.status(200).send(items);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Read one
app.get('/items/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).send();
        res.status(200).send(item);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Update
app.put('/items/:id', async (req, res) => {
    try {
        const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!item) return res.status(404).send();
        res.status(200).send(item);
    } catch (err) {
        res.status(400).send(err);
    }
});

// Delete
app.delete('/items/:id', async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).send();
        res.status(200).send(item);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
