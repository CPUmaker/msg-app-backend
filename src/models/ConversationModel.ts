import mongoose from "mongoose";
import { IParticipant } from "./CoversationParticipantModel";
import { IMessage } from "./MessageModel";

export interface IConversation extends mongoose.Document {
  participants: (mongoose.Types.ObjectId | IParticipant)[];
  messages: (mongoose.Types.ObjectId | IMessage)[];
  latestMessage: mongoose.Types.ObjectId | IMessage;
}

const ConversationSchema = new mongoose.Schema<IConversation>(
  {
    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Participant",
      required: true,
    },
    messages: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Message",
      required: true,
    },
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

const ConversationModel = mongoose.model<IConversation>("Conversation", ConversationSchema);

export default ConversationModel;
