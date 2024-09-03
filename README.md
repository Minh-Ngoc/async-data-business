# Next.js & NextUI Template

This is a template for creating applications using Next.js 14 (app directory) and NextUI (v2).

[Try it on CodeSandbox](https://githubbox.com/nextui-org/next-app-template)

## Technologies Used

- [Next.js 14](https://nextjs.org/docs/getting-started)
- [NextUI v2](https://nextui.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [next-themes](https://github.com/pacocoursey/next-themes)

## How to Use

### Use the template with create-next-app

To create a new project based on this template using `create-next-app`, run the following command:

```bash
npx create-next-app -e https://github.com/nextui-org/next-app-template
```

### Install dependencies

You can use one of them `npm`, `yarn`, `pnpm`, `bun`, Example using `npm`:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@nextui-org/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are installed correctly.

## License

Licensed under the [MIT license](https://github.com/nextui-org/next-app-template/blob/main/LICENSE).

<!-- Backup Sudgets Service -->
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ServiceEnum,
  StatusEnum,
  Suggest,
  SuggestDocument,
} from './suggest.entity';
import { ActionUpdateEnum, SyncMarketingDTO } from './dto/sync-marketing.dto';
import { User, UserDocument } from '../user/entity/user.entity';
import { StatusResponse } from '../common/StatusResponse';
import { SyncBusinessDTO } from './dto/sync-business.dto';
import { Model, Types } from 'mongoose';
import { GetPagingByUserDto } from '../task/dto/get-paging-by-user.dto';
import { SyncEntityDTO } from './dto/sync-entity.dto';
import { convertToUTC, getFirstDayOfMonth, getLastDayOfMonth } from 'src/utils';

@Injectable()
export class SuggestService {
  constructor(
    @InjectModel(Suggest.name)
    private readonly suggestModel: Model<SuggestDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async syncMarketing(data: SyncMarketingDTO) {
    try {
      switch (data.action) {
        case ActionUpdateEnum.CREATE: {
          const checkUser = await this.userModel.findOne({
            $or: [
              { name: { $regex: new RegExp(data.createdBy, 'i') } },
              { username: { $regex: new RegExp(data.createdBy, 'i') } },
            ],
          });
          if (!checkUser)
            throw new HttpException(
              {
                status: StatusResponse.NOT_FOUND_USER_BY_USERNAME_OR_NAME,
                message: `Not Found User By Name Or Username: ${data.createdBy}`,
              },
              HttpStatus.BAD_REQUEST,
            );
          const budgetsUsed = await this.caculateUserBudget(checkUser._id);
          const userBudget = checkUser.budgets - budgetsUsed;
          if (userBudget < data.price)
            throw new HttpException(
              {
                status: StatusResponse.BUDGET_USER_NOT_ENOUGH,
                message: "User's Budget Not Enough",
              },
              HttpStatus.BAD_REQUEST,
            );
          await this.suggestModel.create({
            ...data,
            createdBy: checkUser._id,
            status:
              data.status === 1 ? StatusEnum.COMPLETE : StatusEnum.INITIAL,
          });
          return {
            status: StatusResponse.SUCCESS,
            message: 'Create Suggest And Update New Budget For User Success',
          };
        }
        case ActionUpdateEnum.UPDATE: {
          const suggest = await this.suggestModel.findOne({
            orderCode: data.orderCode,
          });
          if (!suggest) {
            const checkUser = await this.userModel.findOne({
              $or: [
                { name: { $regex: new RegExp(data.createdBy, 'i') } },
                { username: { $regex: new RegExp(data.createdBy, 'i') } },
              ],
            });
            if (!checkUser)
              throw new HttpException(
                {
                  status: StatusResponse.NOT_FOUND_USER_BY_USERNAME_OR_NAME,
                  message: `Not Found User By Name Or Username: ${data.createdBy}`,
                },
                HttpStatus.BAD_REQUEST,
              );

            await this.suggestModel.create({
              ...data,
              createdBy: checkUser._id,
              status:
                data.status === 1 ? StatusEnum.COMPLETE : StatusEnum.INITIAL,
            });
            await checkUser.save();
            return {
              status: StatusResponse.SUCCESS,
              message: 'Create Suggest And Update New Budget For User Success',
              data: {
                newBalance: checkUser.budgets,
              },
            };
          } else {
            const checkUser = await this.userModel.findById(suggest.createdBy);
            if (!checkUser)
              throw new HttpException(
                {
                  status: StatusResponse.NOT_FOUND_USER_BY_USERNAME_OR_NAME,
                  message: `Not Found User By Name Or Username: ${data.createdBy}`,
                },
                HttpStatus.BAD_REQUEST,
              );
            const budgetsUsed = await this.caculateUserBudget(checkUser._id);
            const userBudget =
              checkUser.budgets - (budgetsUsed - suggest.price + data.price);
            if (userBudget < 0)
              throw new HttpException(
                {
                  status: StatusResponse.BUDGET_USER_NOT_ENOUGH,
                  message: "User's Budget Cannot Be Negative",
                },
                HttpStatus.BAD_REQUEST,
              );
            await this.suggestModel.findByIdAndUpdate(suggest._id, {
              ...data,
              createdBy: suggest.createdBy,
              status:
                data.status === 1 ? StatusEnum.COMPLETE : StatusEnum.INITIAL,
            });
            return {
              status: StatusResponse.SUCCESS,
              message: 'Update Suggest And Update New Budget For User Success',
              data: {
                newBalance: checkUser.budgets,
              },
            };
          }
        }
        case ActionUpdateEnum.CANCEL: {
          const suggest = await this.suggestModel.findOne({
            orderCode: data.orderCode,
          });
          if (!suggest)
            throw new HttpException(
              {
                status: StatusResponse.ORDER_CODE_NOT_FOUND,
                message: `Not Found Order Code : ${data.orderCode}`,
              },
              HttpStatus.BAD_REQUEST,
            );
          const checkUser = await this.userModel.findById(suggest.createdBy);
          await suggest.deleteOne();
          return {
            status: StatusResponse.SUCCESS,
            message: 'Delete Suggest And Update New Budget For User Success',
            data: {
              newBalance: checkUser.budgets,
            },
          };
        }
        default:
          break;
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: JSON.stringify(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async syncBusiness(data: SyncBusinessDTO) {
    try {
      const checkUser = await this.userModel.findOne({
        $or: [
          { name: { $regex: new RegExp(data.createdBy, 'i') } },
          { username: { $regex: new RegExp(data.createdBy, 'i') } },
        ],
      });

      if (!checkUser)
        throw new HttpException(
          {
            status: StatusResponse.NOT_FOUND_USER_BY_USERNAME_OR_NAME,
            message: `Not Found User By Name Or Username: ${data.createdBy}`,
          },
          HttpStatus.BAD_REQUEST,
        );

      if (
        !checkUser?.budgets ||
        checkUser?.budgets < 0 ||
        checkUser?.budgets < data.price
      )
        throw new HttpException(
          {
            status: StatusResponse.BUDGET_USER_NOT_ENOUGH,
            message: "User's Budget Not Enough",
          },
          HttpStatus.BAD_REQUEST,
        );

      const valueBudgets = checkUser?.budgets - data.price;

      checkUser.budgets = valueBudgets;

      await this.suggestModel.create({
        ...data,
        status: StatusEnum.COMPLETE,
      });

      await checkUser.save();

      return {
        status: StatusResponse.SUCCESS,
        message: 'Create Suggest And Update New Budget For User Success',
        data: {
          newBalance: checkUser.budgets,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: JSON.stringify(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPagingByUser(query: GetPagingByUserDto) {
    try {
      const { createdBy, pageIndex, pageSize, startDate, endDate, service } =
        query;

      const limit = pageSize ? Number(pageSize) : 10;
      const skip = pageIndex ? Number(pageSize) * (Number(pageIndex) - 1) : 0;

      const filter = {};

      if (startDate && endDate) {
        filter['date'] = {
          $lte: new Date(endDate),
          $gte: new Date(startDate),
        };
      }
      if (service) {
        filter['detailServices.service'] = service;
      }

      const [data] = await this.suggestModel.aggregate([
        {
          $unwind: {
            path: '$detailServices',
          },
        },
        {
          $match: {
            ...filter,
            createdBy: new Types.ObjectId(createdBy),
          },
        },
        {
          $sort: {
            date: -1,
          },
        },
        {
          $facet: {
            result: [
              {
                $skip: skip,
              },
              {
                $limit: limit,
              },
            ],
            total: [
              {
                $count: 'count',
              },
            ],
          },
        },
        {
          $project: {
            result: 1,
            total: {
              $arrayElemAt: ['$total.count', 0],
            },
          },
        },
      ]);

      return {
        status: StatusResponse.SUCCESS,
        messsage: 'Get Paging Suggests Success',
        total: data?.total || 0,
        suggests: data?.result || [],
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: JSON.stringify(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTotalSuggestedUsed(userId: string) {
    try {
      const servicesEnumMapping = Object.entries(ServiceEnum).reduce(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (acc, [key, value]) => {
          acc[value] = [
            {
              $match: {
                createdBy: new Types.ObjectId(userId),
              },
            },
            {
              $unwind: {
                path: '$detailServices',
              },
            },
            {
              $match: {
                'detailServices.service': value,
              },
            },
            {
              $group: {
                _id: null,
                sum: {
                  $sum: '$detailServices.price',
                },
              },
            },
            {
              $project: {
                _id: 0,
                sum: 1,
              },
            },
          ];
          return acc;
        },
        {},
      );

      const valueServicesEnumMapping = Object.entries(ServiceEnum).reduce(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (acc, [key, value]) => {
          acc[value] = [
            {
              $ifNull: [{ $arrayElemAt: [`$${value}.sum`, 0] }, 0],
            },
          ];
          return acc;
        },
        {},
      );

      const aggregation = [
        {
          $facet: {
            total: [
              {
                $match: {
                  createdBy: new Types.ObjectId(userId),
                },
              },
              {
                $group: {
                  _id: null,
                  sum: {
                    $sum: '$price',
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  sum: 1,
                },
              },
            ],
            ...servicesEnumMapping,
          },
        },
        {
          $project: {
            total: {
              $arrayElemAt: ['$total.sum', 0],
            },
            ...valueServicesEnumMapping,
          },
        },
      ];

      const [response] = await this.suggestModel.aggregate(aggregation);

      return {
        status: StatusResponse.SUCCESS,
        messsage: 'Get Total Suggested Used Success!',
        response,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: JSON.stringify(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async syncEntity(data: SyncEntityDTO) {
    try {
      switch (data.action) {
        case ActionUpdateEnum.CREATE: {
          const checkUser = await this.userModel.findOne({
            $or: [
              { name: { $regex: new RegExp(data.createdBy, 'i') } },
              { username: { $regex: new RegExp(data.createdBy, 'i') } },
            ],
          });
          if (!checkUser)
            throw new HttpException(
              {
                status: StatusResponse.NOT_FOUND_USER_BY_USERNAME_OR_NAME,
                message: `Not Found User By Name Or Username: ${data.createdBy}`,
              },
              HttpStatus.BAD_REQUEST,
            );
          await this.suggestModel.create({
            ...data,
            createdBy: checkUser._id,
            status:
              data.status === 1 ? StatusEnum.COMPLETE : StatusEnum.INITIAL,
          });
          return {
            status: StatusResponse.SUCCESS,
            message: 'Create Suggest And Update New Budget For User Success',
            data: {
              newBalance: checkUser.budgets,
            },
          };
        }
        case ActionUpdateEnum.UPDATE: {
          const suggest = await this.suggestModel.findOne({
            orderCode: data.orderCode,
          });
          if (!suggest)
            throw new HttpException(
              {
                status: StatusResponse.ORDER_CODE_NOT_FOUND,
                message: `Not Found Order Code : ${data.orderCode}`,
              },
              HttpStatus.BAD_REQUEST,
            );
          const checkUser = await this.userModel.findById(suggest.createdBy);
          if (!checkUser)
            throw new HttpException(
              {
                status: StatusResponse.NOT_FOUND_USER_BY_USERNAME_OR_NAME,
                message: `Not Found User By Name Or Username: ${data.createdBy}`,
              },
              HttpStatus.BAD_REQUEST,
            );
          await this.suggestModel.findByIdAndUpdate(suggest._id, {
            ...data,
            createdBy: suggest.createdBy,
            status:
              data.status === 1 ? StatusEnum.COMPLETE : StatusEnum.INITIAL,
          });
          return {
            status: StatusResponse.SUCCESS,
            message: 'Update Suggest And Update New Budget For User Success',
            data: {
              newBalance: checkUser.budgets,
            },
          };
        }
        case ActionUpdateEnum.CANCEL: {
          const suggest = await this.suggestModel.findOne({
            orderCode: data.orderCode,
          });
          if (!suggest)
            throw new HttpException(
              {
                status: StatusResponse.ORDER_CODE_NOT_FOUND,
                message: `Not Found Order Code : ${data.orderCode}`,
              },
              HttpStatus.BAD_REQUEST,
            );
          const checkUser = await this.userModel.findById(suggest.createdBy);
          await suggest.deleteOne();
          return {
            status: StatusResponse.SUCCESS,
            message: 'Delete Suggest And Update New Budget For User Success',
            data: {
              newBalance: checkUser.budgets,
            },
          };
        }
        default:
          break;
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: JSON.stringify(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async caculateUserBudget(
    userId: Types.ObjectId,
    _startDate?: Date,
    _endDate?: Date,
  ): Promise<number> {
    try {
      let startDate: Date, endDate: Date;
      _startDate
        ? (startDate = convertToUTC(_startDate))
        : (startDate = convertToUTC(getFirstDayOfMonth(new Date())));
      _endDate
        ? (endDate = convertToUTC(_endDate))
        : (endDate = convertToUTC(getLastDayOfMonth(new Date())));
      const result = await this.suggestModel.aggregate([
        {
          $match: {
            createdBy: userId,
            date: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalBudget: { $sum: '$price' },
          },
        },
      ]);

      const totalBudget = result.length > 0 ? result[0].totalBudget : 0;
      return totalBudget;
    } catch (error) {
      throw new HttpException(
        { status: HttpStatus.INTERNAL_SERVER_ERROR, error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
