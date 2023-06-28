import mongoose from "mongoose";

import { IConversation } from "./ConversationModel";
import { IUser } from "./UserModel";

export interface IMessage extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  conversation: mongoose.Types.ObjectId | IConversation;
  sender: mongoose.Types.ObjectId | IUser;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new mongoose.Schema<IMessage>(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const MessageModel = mongoose.model<IMessage>("Message", MessageSchema);

export default MessageModel;
