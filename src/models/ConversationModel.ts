import mongoose from "mongoose";
import Participant, { IParticipant } from "./CoversationParticipantModel";
import Message, { IMessage } from "./MessageModel";

export interface IConversation extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
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

ConversationSchema.pre("findOneAndDelete", async function preDelete() {
  const query = this.getQuery();
  if (query._id) {
    await Participant.deleteMany({conversation: query._id});
    await Message.deleteMany({conversation: query._id});
  }
});

const ConversationModel = mongoose.model<IConversation>("Conversation", ConversationSchema);

export default ConversationModel;
