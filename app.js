const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const sharp = require("sharp");

const app = express();
const port = 3000;
app.use(cors());

app.use(express.json());

// Configuración de Multer para el almacenamiento de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/"); // Directorio donde se guardarán las imágenes
  },
  filename: function (req, file, cb) {
    // El nombre de archivo será el ID del usuario (puedes modificarlo según tus necesidades)
    cb(null, req.params.userId + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Ruta para subir o reemplazar una imagen
app.post("/upload/:userId", upload.single("image"), (req, res) => {
  const userId = req.params.userId;
  const imagePathJPG = path.join("./uploads/", userId + ".jpg");
  const imagePathPNG = path.join("./uploads/", userId + ".png");

  // Mueve el archivo JPG a una ubicación temporal o con un nombre temporal
  const tempImagePathJPG = path.join("./uploads/", userId + "_temp.jpg");

  fs.rename(imagePathJPG, tempImagePathJPG, (err) => {
    if (err) {
      console.error("Error al mover el archivo JPG", err);
      res.status(500).send("Error al subir y convertir la imagen");
      return;
    }

    // Realiza la conversión desde el archivo temporal
    sharp(tempImagePathJPG).toFile(imagePathPNG, (conversionError) => {
      if (conversionError) {
        console.error(
          "Error al convertir y guardar la imagen en formato PNG",
          conversionError
        );
        res.status(500).send("Error al subir y convertir la imagen");
      } else {
        // Elimina el archivo JPG temporal
        fs.unlink(tempImagePathJPG, (deleteError) => {
          if (deleteError) {
            console.error(
              "Error al eliminar el archivo JPG temporal",
              deleteError
            );
          }
          res.send("Imagen subida y convertida a PNG correctamente");
        });
      }
    });
  });
});
// Ruta para obtener la imagen
app.get("/get/:userId", (req, res) => {
  const userId = req.params.userId;
  const imagePath = path.join("./uploads/", userId + ".png"); // Asegúrate de que la extensión coincida con la que utilizas

  // Verifica si la imagen existe en el sistema de archivos
  if (fs.existsSync(imagePath)) {
    // Si la imagen existe, envíala como respuesta
    res.sendFile(imagePath);
  } else {
    // Si la imagen no existe, devuelve una respuesta de error o una imagen predeterminada
    res.status(404).send("Imagen no encontrada");
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
