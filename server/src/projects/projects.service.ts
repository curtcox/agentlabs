import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { err, ok, PResult } from '../common/result';
import { PrismaService } from '../prisma/prisma.service';
import { CreatedProjectDto } from './dtos/created.project.dto';
import { ListProjectsResultDto } from './dtos/list.projects.result.dto';
import {
  CreateProjectError,
  ListOrganizationProjectsError,
  VerifyIfIsOrganizationUserError,
} from './projects.errors';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyIfOrganizationUser(params: {
    userId: string;
    organizationId: string;
  }): PResult<{ isMember: true }, VerifyIfIsOrganizationUserError> {
    const { userId, organizationId } = params;
    const organization = await this.prisma.organization.findFirst({
      where: {
        id: organizationId,
      },
      include: {
        users: true,
      },
    });

    if (!organization) {
      return err('OrganizationNotFound');
    }

    if (!organization?.users?.find((user) => user.userId === userId)) {
      return err('NotAnOrganizationUser');
    }

    return ok({ isMember: true });
  }

  async createProject(dto: {
    name: string;
    slug: string;
    creatorId: string;
    organizationId: string;
  }): PResult<CreatedProjectDto, CreateProjectError> {
    try {
      const { name, slug, creatorId, organizationId } = dto;

      const verifyResult = await this.verifyIfOrganizationUser({
        userId: creatorId,
        organizationId,
      });

      if (!verifyResult.ok) {
        return err(verifyResult.error);
      }

      const onboarding = await this.prisma.onboarding.findUnique({
        where: {
          userId: creatorId,
          organizationId,
        },
      });

      let connectOnboardingQuery = undefined;
      if (onboarding?.id && !onboarding.projectId) {
        connectOnboardingQuery = {
          connect: {
            id: onboarding.id,
          },
        };
      }

      const project = await this.prisma.project.create({
        data: {
          name,
          slug,
          creator: {
            connect: {
              id: creatorId,
            },
          },
          onboardings: connectOnboardingQuery,
          agents: {
            create: [
              {
                name: 'My First Agent',
                creator: {
                  connect: {
                    id: creatorId,
                  },
                },
              },
            ],
          },
          organization: {
            connect: {
              id: organizationId,
            },
          },
        },
      });

      return ok({
        name: project.name,
        slug: project.slug,
        id: project.id,
        organizationId: project.organizationId,
        creatorId: project.creatorId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          return err('SlugAlreadyTaken');
        }
      }

      console.error('Error while creating project', e);

      throw e;
    }
  }

  async listOrganizationProjects(dto: {
    userId: string;
    organizationId: string;
  }): PResult<ListProjectsResultDto, ListOrganizationProjectsError> {
    const { userId, organizationId } = dto;
    const verifyResult = await this.verifyIfOrganizationUser({
      userId,
      organizationId,
    });

    if (!verifyResult.ok) {
      return err(verifyResult.error);
    }

    const projects = await this.prisma.project.findMany({
      where: {
        organizationId,
      },
    });

    return ok({
      items: projects.map((project) => ({ ...project })),
      total: projects.length,
    });
  }

  async projectExists(slug: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    return !!project;
  }
}
