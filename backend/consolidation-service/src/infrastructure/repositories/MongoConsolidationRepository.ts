import mongoose, { Schema, Document } from 'mongoose';
import { IConsolidationRepository } from '../../domain/IConsolidationRepository.js';
import { DailyConsolidation } from '../../domain/DailyConsolidation.js';

interface IDailyConsolidationDoc extends Document {
  merchantId: string;
  date: string;
  totalCreditsInCents: number;
  totalDebitsInCents: number;
  netBalanceInCents: number;
  transactionCount: number;
  updatedAt: Date;
}

const DailyConsolidationSchema = new Schema<IDailyConsolidationDoc>(
  {
    merchantId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    totalCreditsInCents: { type: Number, required: true, default: 0 },
    totalDebitsInCents: { type: Number, required: true, default: 0 },
    netBalanceInCents: { type: Number, required: true, default: 0 },
    transactionCount: { type: Number, required: true, default: 0 },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

DailyConsolidationSchema.index({ merchantId: 1, date: 1 }, { unique: true });

const DailyConsolidationModel = mongoose.model<IDailyConsolidationDoc>(
  'DailyConsolidation',
  DailyConsolidationSchema
);

export class MongoConsolidationRepository implements IConsolidationRepository {
  public async findByMerchantAndDate(merchantId: string, date: string): Promise<DailyConsolidation | null> {
    const doc = await DailyConsolidationModel.findOne({ merchantId, date });
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  public async upsert(consolidation: DailyConsolidation): Promise<void> {
    await DailyConsolidationModel.findOneAndUpdate(
      { merchantId: consolidation.getMerchantId(), date: consolidation.getDate() },
      {
        totalCreditsInCents: consolidation.getTotalCreditsInCents(),
        totalDebitsInCents: consolidation.getTotalDebitsInCents(),
        netBalanceInCents: consolidation.getNetBalanceInCents(),
        transactionCount: consolidation.getTransactionCount(),
        updatedAt: consolidation.getUpdatedAt()
      },
      { upsert: true, new: true }
    );
  }

  public async findByMerchant(merchantId: string, limit: number = 30): Promise<DailyConsolidation[]> {
    const docs = await DailyConsolidationModel.find({ merchantId })
      .sort({ date: -1 })
      .limit(limit);
    return docs.map((d) => this.mapToDomain(d));
  }

  private mapToDomain(doc: IDailyConsolidationDoc): DailyConsolidation {
    return new DailyConsolidation(
      doc.merchantId,
      doc.date,
      doc.totalCreditsInCents,
      doc.totalDebitsInCents,
      doc.netBalanceInCents,
      doc.transactionCount,
      doc.updatedAt
    );
  }
}
