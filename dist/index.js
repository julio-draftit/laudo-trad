"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const azure_storage_1 = require("azure-storage");
const azure = require("azure-storage");
const cors = require("cors");
const uuid_1 = require("uuid");
const body_parser_1 = __importDefault(require("body-parser"));
console.log("Iniciando Aplicação");
const app = (0, express_1.default)();
app.use(cors());
app.use(body_parser_1.default.json());
const port = 8080;
console.log("Port: " + port);
const ACCOUNT_NAME = "storage1hiae";
const ACCOUNT_KEY = "hNNIZm5gLfpJRyeAt5DauKA3JUwGBmNerLOPCSSTc3LoR4Re6+aTFArE5bxQlR7v+5ZWwcbciSBy+AStKVISLQ==";
const blobService = (0, azure_storage_1.createBlobService)(ACCOUNT_NAME, ACCOUNT_KEY);
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: "Nenhum arquivo enviado.",
        });
    }
    const blobName = `${(0, uuid_1.v4)()}-${req.file.originalname}`;
    blobService.createBlockBlobFromText("input", // Altere para o nome do seu container
    blobName, req.file.buffer, (err, result) => {
        if (err) {
            return res
                .status(500)
                .send("Erro ao fazer upload para o Azure Blob Storage: " + err.message);
        }
        res.status(200).json({
            message: "Arquivo enviado para a pasta input no Azure Blob Storage.",
            fileName: blobName,
        });
    });
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
        const sasToken = blobService.generateSharedAccessSignature("output", blobName, sharedAccessPolicy);
        const sasUrl = blobService.getUrl("output", blobName, sasToken);
        res.status(200).json({ downloadUrl: sasUrl });
    });
});
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
