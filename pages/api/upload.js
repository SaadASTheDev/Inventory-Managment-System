// pages/api/upload.js
import { ImageAnnotatorClient } from '@google-cloud/vision';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

const client = new ImageAnnotatorClient({
  keyFilename: path.join(process.cwd(), 'path_to_your_service_account_key.json'),
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).send(err);
    }

    const filePath = files.image.filepath;

    try {
      const [result] = await client.labelDetection(filePath);
      const labels = result.labelAnnotations;
      const items = labels.map(label => label.description);

      // Clean up the uploaded file
      fs.unlinkSync(filePath);

      return res.status(200).json({ items });
    } catch (error) {
      console.error('Error processing image:', error);
      return res.status(500).send('Error processing image');
    }
  });
};

export default handler;
