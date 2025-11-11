import Setting from '../models/Setting.js';
import { uploadImage } from '../services/cloudinary.service.js';

export const getSettings = async (req, res) => {
  try {
    let doc = await Setting.findOne({});
    if (!doc) {
      doc = await Setting.create({});
    }
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    let doc = await Setting.findOne({});
    if (!doc) {
      doc = await Setting.create({});
    }

    const updates = {};
    // Accept files with names: homeBackground, homePoster, designBackground
    const map = {
      homeBackground: 'homeBackground',
      homePoster: 'homePoster',
      designBackground: 'designBackground',
    };

    if (req.files) {
      for (const key of Object.keys(map)) {
        const files = req.files[key];
        if (files && files.length) {
          const uploaded = await uploadImage(files[0].path);
          updates[map[key]] = uploaded;
        }
      }
    }

    Object.assign(doc, updates);
    await doc.save();

    return res.json({ success: true, data: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || 'Failed to update settings' });
  }
};


