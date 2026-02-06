# 🚀 API Usuarios & Grupos con Inngest + MongoDB

Este proyecto es una API-REST reciclada de un ejercicio anterior desarrollada con **Node.js** y **Express**, que utiliza **MongoDB** como base de datos y **Inngest** para la orquestación de tareas en segundo plano y procesos programados (crons).

## 🛠️ Tecnologías utilizadas

* **Express**: Framework para el servidor web.
* **MongoDB**: Base de datos NoSQL para el almacenamiento de usuarios y grupos.
* **Inngest**: Motor de flujos de trabajo (Workflows) para automatización.
* **Telegram Bot API**: Notificaciones en tiempo real.



## 🚀 Cómo ponerlo en marcha

Para que el sistema funcione completamente, debes tener activos dos procesos simultáneos:

1.  **Servidor de la API (http://localhost:3000/):**
    ```bash
    node index.js
    ```
2.  **Inngest Dev Server (El orquestador - http://localhost:8288/):**
    ```bash
    npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
    ```



## Estructura del Proyecto
```
inngestApiMongo/
├─ capturas/
│  ├─ Screenshot_1.png
│  ├─ Screenshot_2.png
│  ├─ Screenshot_3.png
│  └─ Screenshot_4b.jpeg
├─ .env
├─ .gitignore
├─ index.js
├─ package-lock.json
├─ package.json
├─ README.md
└─ request.http
```



## 📩 Notificaciones
El bot de Telegram actúa como nuestro centro de alertas, informando sobre:
* Consultas de lectura en las colecciones.
* Reportes de estado del sistema cada 2 minutos.



## 📸 Capturas del proceso
### Cliente Inngest - Nuevas funciones implementadas
![Nuevas funciones implementadas](/capturas/Screenshot_1.png)
### Cliente Inngest - Sincronización entre API e Inngest
![Sincronización entre API e Inngest](/capturas/Screenshot_2.png)
### Cliente Inngest - Peticiones satisfactorias
![Peticiones satisfactorias](/capturas/Screenshot_3.png)
### Bot de Telegram - Confirmación peticiones satisfactorias
![Comprobación en Telegram](/capturas/Screenshot_4b.jpeg)