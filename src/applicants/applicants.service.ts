import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import {
    CreateApplicantDto,
    ReturnApplicantDto,
    UpdateApplicantDto,
} from './applicant.dto';
import { Applicant } from './applicant.entity';

@Injectable()
export class ApplicantsService {
    private readonly logger = new Logger(ApplicantsService.name);

    constructor(
        @InjectRepository(Applicant)
        private readonly applicantsRepository: Repository<Applicant>,
    ) {}

    async findOne(username: string): Promise<Applicant | undefined> {
        const applicant: Applicant = await this.applicantsRepository.findOne({
            where: { username },
        });

        if (!applicant) {
            this.logger.error(`Applicant with username ${username} not found`);
            throw new NotFoundException(
                `Applicant with username ${username} not found`,
            );
        }

        return applicant;
    }

    async getApplicant(username: string): Promise<ReturnApplicantDto> {
        const applicant: Applicant = await this.applicantsRepository.findOne({
            where: { username },
        });

        if (!applicant) {
            this.logger.error(`Applicant with username ${username} not found`);
            throw new NotFoundException(
                `Applicant with username ${username} not found`,
            );
        }

        const returnApplicantDto = plainToInstance(
            ReturnApplicantDto,
            applicant,
        );
        return returnApplicantDto;
    }

    async createApplicant(
        createApplicantDto: CreateApplicantDto,
    ): Promise<boolean> {
        const countOfApplicants: number = await this.applicantsRepository.count(
            {
                where: [
                    { username: createApplicantDto.username },
                    { email: createApplicantDto.email },
                ],
            },
        );

        if (countOfApplicants > 0) {
            this.logger.error(
                `Applicant with username ${createApplicantDto.username} or email ${createApplicantDto.email} already exists`,
            );
            throw new ConflictException(
                `Applicant with username ${createApplicantDto.username} or email ${createApplicantDto.email} already exists`,
            );
        }

        let applicant: Applicant = plainToInstance(
            Applicant,
            createApplicantDto,
        );
        applicant = this.applicantsRepository.create(applicant);
        await this.applicantsRepository.save(applicant);
        return true;
    }

    async updateOne(
        username: string,
        updateApplicantDto: UpdateApplicantDto,
    ): Promise<ReturnApplicantDto> {
        let applicant = await this.applicantsRepository.findOne({
            where: { username },
        });

        if (!applicant) {
            throw new NotFoundException(
                `Applicant with username ${username} not found`,
            );
        }

        // doing this step to ensure that only defined fields are updated
        // and undefined fields are not updated
        updateApplicantDto = instanceToPlain(updateApplicantDto, {
            exposeUnsetFields: false,
        });
        applicant = plainToInstance(
            Applicant,
            {
                ...applicant,
                ...updateApplicantDto,
            },
            {
                exposeUnsetFields: false,
            },
        );

        applicant = await this.applicantsRepository.save(applicant);
        const returnApplicantDto: ReturnApplicantDto = plainToInstance(
            ReturnApplicantDto,
            applicant,
        );
        return returnApplicantDto;
    }
}
