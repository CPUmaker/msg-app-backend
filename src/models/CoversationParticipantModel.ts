import mongoose from "mongoose";
import { IUser } from "./UserModel";
import { IConversation } from "./ConversationModel";

export interface IParticipant extends mongoose.Document {
  user: mongoose.Types.ObjectId | IUser;
  conversation: mongoose.Types.ObjectId | IConversation;
  hasSeenLatestMessage: boolean;
}

const ConversationParticipantSchema = new mongoose.Schema<IParticipant>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    hasSeenLatestMessage: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

const ConversationParticipantModel = mongoose.model<IParticipant>(
  "Participant",
  ConversationParticipantSchema
);

export default ConversationParticipantModel;
