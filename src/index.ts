import express from "express";
import multer from "multer";
import { createBlobService } from "azure-storage";
const azure = require("azure-storage");
const cors = require("cors");
import { v4 as uuidv4 } from "uuid";
import bodyParser from "body-parser";

interface MulterRequest extends express.Request {
  file?: any;
}
console.log("Iniciando Aplicação");
const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = 8080;
console.log("Port: " + port);
const ACCOUNT_NAME = "storage1hiae";
const ACCOUNT_KEY =
  "hNNIZm5gLfpJRyeAt5DauKA3JUwGBmNerLOPCSSTc3LoR4Re6+aTFArE5bxQlR7v+5ZWwcbciSBy+AStKVISLQ==";

const blobService = createBlobService(ACCOUNT_NAME, ACCOUNT_KEY);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload", upload.single("file"), (req: MulterRequest, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Nenhum arquivo enviado.",
    });
  }

  const blobName = `${uuidv4()}-${req.file.originalname}`;

  blobService.createBlockBlobFromText(
    "input", // Altere para o nome do seu container
    blobName,
    req.file.buffer,
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .send(
            "Erro ao fazer upload para o Azure Blob Storage: " + err.message
          );
      }
      res.status(200).json({
        message: "Arquivo enviado para a pasta input no Azure Blob Storage.",
        fileName: blobName,
      });
    }
  );
});

app.post("/download", (req, res) => {
  const filename = req.body.filename;
  if (!filename) {
    return res.status(400).send("Nome do arquivo não fornecido.");
  }

  const blobName = filename;

  blobService.doesBlobExist("output", blobName, (error, result) => {
    if (error) {
      return res.status(200).json({ downloadUrl: "Arquivo não encontrado" });
    }

    if (!result.exists) {
      return res.status(200).json({ downloadUrl: "Arquivo não encontrado" });
    }

    const startDate = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setMinutes(startDate.getMinutes() + 100);

    const sharedAccessPolicy = {
      AccessPolicy: {
        Permissions: azure.BlobUtilities.SharedAccessPermissions.READ,
        Start: startDate,
        Expiry: expiryDate,
      },
    };

    const sasToken = blobService.generateSharedAccessSignature(
      "output",
      blobName,
      sharedAccessPolicy
    );
    const sasUrl = blobService.getUrl("output", blobName, sasToken);

    res.status(200).json({ downloadUrl: sasUrl });
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
