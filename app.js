const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const sharp = require("sharp");
const { Octokit } = require("@octokit/rest");

const app = express();
const port = 3000;
app.use(cors());

app.use(express.json());

const octokit = new Octokit({
  auth: "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", // Asegúrate de definir esta variable de entorno
});

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
app.post("/upload/:userId", upload.single("image"), async (req, res) => {
  const userId = req.params.userId;
  const imagePathPNG = path.join(__dirname, "uploads", userId + ".png");

  // Convierte el archivo de imagen al formato PNG directamente
  sharp(req.file.path).toFile(imagePathPNG, async (conversionError) => {
    if (conversionError) {
      console.error(
        "Error al convertir y guardar la imagen en formato PNG",
        conversionError
      );
      res.status(500).send("Error al subir y convertir la imagen");
    } else {
      // Elimina el archivo original
      fs.unlink(req.file.path, (deleteError) => {
        if (deleteError) {
          console.error("Error al eliminar el archivo original", deleteError);
        }
        // Subir la imagen a GitHub
        uploadImageToGitHub(userId, imagePathPNG)
          .then(() => {
            res.send("Imagen subida y convertida a PNG correctamente");
          })
          .catch((uploadError) => {
            console.error("Error al subir la imagen a GitHub", uploadError);
            res.status(500).send("Error al subir la imagen a GitHub");
          });
      });
    }
  });
});

async function uploadImageToGitHub(userId, imagePath) {
  try {
    const fileContent = fs.readFileSync(imagePath);
    await octokit.repos.createOrUpdateFile({
      owner: "eduarchilon",
      repo: "avatar-api",
      path: `uploads/${userId}.png`,
      message: `Subida de imagen para ${userId}`,
      content: fileContent.toString("base64"),
    });
  } catch (error) {
    throw error;
  }
}

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
