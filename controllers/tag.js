const Tag = require("../models/Tag");

exports.getTags = async (req, res, next) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });

    return res.status(200).json({ tags });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.getTag = async (req, res, next) => {
  const { name } = req.body;
  try {
    const tag = Tag.findOne(name);

    if (!tag) return res.status(400).json({ message: "Tag does not exist" });

    return res.status(200).json({ tag });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.createTag = async (req, res, next) => {
  const { name } = req.body;
  try {
    const tag = new Tag({
      name,
    });

    await tag.save();

    return res.status(200).json({ message: "Tag created" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
