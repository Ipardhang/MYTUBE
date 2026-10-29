import mongoose from "mongoose";
import users from "../Modals/Auth.js";

export const login = async (req, res) => {
  const email = req.auth?.email;
  const name = req.auth?.name || req.body.name;
  const image = req.auth?.picture || req.body.image;
  if (!email) return res.status(401).json({ message: "A valid sign-in is required." });

  try {
    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      const newUser = await users.create({ email, name, image });
      return res.status(201).json({ result: newUser });
    } else {
      const updated = await users.findByIdAndUpdate(existingUser._id, { $set: { name, image } }, { new: true });
      return res.status(200).json({ result: updated });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  try {
    const account = await users.findById(_id).select("email").lean();
    if (!account || account.email?.toLowerCase() !== req.auth?.email?.toLowerCase()) {
      return res.status(403).json({ message: "You can only update your own channel." });
    }
    const updatedata = await users.findByIdAndUpdate(
      _id,
      {
        $set: {
          channelname: channelname,
          description: description,
        },
      },
      { new: true }
    );
    return res.status(201).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getChannel = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid channel." });
  try {
    const channel = await users.findById(req.params.id).select("name channelname description image joinedon").lean();
    if (!channel) return res.status(404).json({ message: "Channel not found." });
    const subscribers = await users.countDocuments({ subscribedTo: channel._id });
    return res.status(200).json({ ...channel, subscribers });
  } catch (error) {
    console.error("Channel lookup error:", error);
    return res.status(500).json({ message: "Could not load channel." });
  }
};

export const toggleSubscription = async (req, res) => {
  const targetId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(targetId)) return res.status(400).json({ message: "Invalid channel." });
  try {
    const viewer = await users.findOne({ email: req.auth?.email });
    const channel = await users.findById(targetId);
    if (!viewer || !channel) return res.status(404).json({ message: "Account or channel not found." });
    if (String(viewer._id) === String(channel._id)) return res.status(400).json({ message: "You cannot subscribe to your own channel." });
    const alreadySubscribed = viewer.subscribedTo.some((id) => String(id) === String(channel._id));
    if (alreadySubscribed) viewer.subscribedTo.pull(channel._id);
    else viewer.subscribedTo.addToSet(channel._id);
    await viewer.save();
    const subscribers = await users.countDocuments({ subscribedTo: channel._id });
    return res.status(200).json({ subscribed: !alreadySubscribed, subscribers });
  } catch (error) {
    console.error("Subscription update error:", error);
    return res.status(500).json({ message: "Could not update subscription." });
  }
};

export const getSubscriptions = async (req, res) => {
  try {
    const viewer = await users.findOne({ email: req.auth?.email }).select("subscribedTo").populate("subscribedTo", "name channelname description image").lean();
    if (!viewer) return res.status(404).json({ message: "Account unavailable." });
    return res.status(200).json((viewer.subscribedTo || []).filter(Boolean));
  } catch (error) {
    console.error("Subscriptions lookup error:", error);
    return res.status(500).json({ message: "Could not load subscriptions." });
  }
};

export const getSubscriptionStatus = async (req, res) => {
  const channelId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(channelId)) return res.status(400).json({ message: "Invalid channel." });
  try {
    const viewer = await users.findOne({ email: req.auth?.email }).select("subscribedTo").lean();
    if (!viewer) return res.status(404).json({ message: "Account unavailable." });
    const subscribers = await users.countDocuments({ subscribedTo: channelId });
    return res.status(200).json({ subscribed: (viewer.subscribedTo || []).some((id) => String(id) === String(channelId)), subscribers });
  } catch (error) {
    console.error("Subscription status error:", error);
    return res.status(500).json({ message: "Could not load subscription status." });
  }
};
