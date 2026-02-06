import 'dotenv/config';
import express from 'express';
import { serve } from "inngest/express";
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import { Inngest } from 'inngest';

// módulo necesario para accerder a variables de entorno

const app = express()
const PUERTO = 3000;

app.use(express.json()); // permite aceptar jsones en body
app.use(express.urlencoded({extended: true}));


const tokenTelegram = process.env.TELEGRAM_BOT_TOKEN;
const idChatTelegram = process.env.TELEGRAM_CHAT_ID;
const uri = "mongodb://127.0.0.1:27017";


// https://www.mongodb.com/docs/drivers/node/current/connect/mongoclient/
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
    await client.connect();
    // Envía ping para confirmar conexión satisfactoria
    await client.db("admin").command({ ping: 1 });
    console.log("Conectado a MongoDB...\n");

  } catch (err) {
    console.error("❌ Error conectando a MongoDB:", err);
    process.exit(1); // Detener la app si no hay base de datos
  }
}

run().catch(console.dir);

app.listen(PUERTO, () => {
  console.log(`\n🚀 API corriendo en http://localhost:${PUERTO}`);
  console.log(`📊 Inngest Dev Server: http://localhost:8288`);
});


// Cliente Inngest
const inngest = new Inngest({
  id: 'usuarios-grupos',
  name: 'Centro Social'
});

// FUNCIÓN INNGEST
const notificacionBasica = inngest.createFunction(
  { id: 'notificacion-basica' },
  { event: 'notificacion/consulta' },
  async ({ event, step }) => {
    const resultado = await step.run('enviar-mensaje-telegram', async () => {
      const mensaje = `📬 *Notificación Básica*\n\n${event.data.mensaje}`;
      return await enviarMensajeTelegram(mensaje);
    });

    return {
      enviado: true,
      mensaje: event.data.mensaje,
      telegramMessageId: resultado.result?.message_id
    };
  }
);

const reportePeriodico = inngest.createFunction(
  { id: 'reporte-periodico' },
  { cron: '*/2 * * * *' },  // ENVÍO CADA 2 MINUTOS
  async ({ step }) => {
    const reporte = await step.run('generar-reporte', async () => {
      // Simular generación de reporte con datos ficticios
      return {
        timestamp: new Date().toLocaleString(),
        estado: "Servidor Activo"
      }
    });

    await step.run('enviar-reporte-telegram', async () => {
      const mensaje = `📊 *Reporte Periódico*\n\n 📅 Fecha: ${reporte.timestamp}\n✅ Estado: ${reporte.estado}`;
      return await enviarMensajeTelegram(mensaje);
    });

    return reporte;
  }
);



// API que Sirve funciones Inngest
app.use("/api/inngest", serve({
  client: inngest,
  functions: [notificacionBasica, reportePeriodico]
}))

// END-POINTS MongoDB
app.post('/usuarios', async (req, res) => {
  realizarConsultaBD(req, res, "CREAR", "usuarios");
});

app.post('/grupos', async (req, res) => {
  realizarConsultaBD(req, res, "CREAR", "grupos");
});

app.get('/usuarios', async (req, res) => {
  realizarConsultaBD(req, res, "LEER", "usuarios");
});

app.get('/usuarios/:id', async (req, res) => {
  realizarConsultaBD(req, res, "LEER", "usuarios");
});

app.get('/grupos', async (req, res) => {
  realizarConsultaBD(req, res, "LEER", "grupos");
});

app.get('/grupos/:id', async (req, res) => {
  realizarConsultaBD(req, res, "LEER", "grupos");
});

app.put('/usuarios/:id', async (req, res) => {
  realizarConsultaBD(req, res, "ACTUALIZAR", "usuarios");
});

app.put('/grupos/:id', async (req, res) => {
  realizarConsultaBD(req, res, "ACTUALIZAR", "grupos");
});

app.delete('/usuarios/:id', async (req, res) => {
  realizarConsultaBD(req, res, "BORRAR", "usuarios");
});

app.delete('/grupos/:id', async (req, res) => {
  realizarConsultaBD(req, res, "BORRAR", "grupos");
});

// VIDEOTUTO
// https://www.youtube.com/watch?v=D332DCt4Y5Y&t=961s
// https://github.com/manufosela/introduccion-docker

//CONSULTAS
async function realizarConsultaBD(req, res, tipoConsulta, coleccionBD) {
  try {
    let result, id, body;

    const conexion = await client.connect();
    const baseDatos = conexion.db('centro');
    const coleccion = baseDatos.collection(coleccionBD);
    
    switch (tipoConsulta) {
        
      case "CREAR":
        body = req.body;

        result = await coleccion.insertOne(body);
        res.status(200).json({ message: "Registro CREADO CORRECTAMENTE - id: " + result.insertedId });

        break;

      case "LEER":
        id = req.params;

        if (JSON.stringify(id) === "{}") {
          result = await coleccion.find().toArray();
        } else {
          //result = await coleccion.find({_id: new mongo.ObjectId(id)}).toArray();
          result = await coleccion.findOne({_id: new ObjectId(id)});
        }
        
        await inngest.send({
          name: 'notificacion/consulta',
          data: {resultado: result}
        });

        // Llamada a 
				if (coleccionBD === "usuarios") {
					await enviarMensajeTelegram(`👁️ *Consulta de Usuarios*: Alguien ha solicitado la lista completa de usuarios.`);
				} else { // grupos
					await enviarMensajeTelegram(`👁️ *Consulta de Grupos*: Alguien ha solicitado la lista completa de grupos.`);
				}

        res.send(result);

        break;

      case "ACTUALIZAR":
        id = req.params.id;
        body = req.body;

        result = await coleccion.updateOne({ _id: new ObjectId(id) }, {$set:body});
        res.status(200).json({ message: "Registro ACTUALIZADO CORRECTAMENTE" });

        break;

      case "BORRAR":
        id = req.params.id;

        result = await coleccion.deleteOne({ _id: new ObjectId(id) });
        res.status(200).json({ message: "Registro BORRADO CORRECTAMENTE" });

        break;
    }

  } catch (err) {
    res.status(400).json({ message: "ERROR - No se encontraron documentos que coincidan con la consulta" });
    console.log(err); 
  }
}


async function enviarMensajeTelegram(mensaje) {
  if (!tokenTelegram || !idChatTelegram) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados');
    console.log('Mensaje que se enviaría:', mensaje);
    return { ok: true, result: { message_id: 'demo' } };
  }

  try {
    const url = `https://api.telegram.org/bot${tokenTelegram}/sendMessage`;
    const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				chat_id: idChatTelegram,
				text: mensaje,
				parse_mode: 'Markdown'
      })
    });

    return await response.json();

  } catch (error) {
    console.error('Error enviando mensaje a Telegram:', error.message);
    throw error;
  }
}
