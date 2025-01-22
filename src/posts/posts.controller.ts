import { Controller, Post, Body, UseGuards, Req, Put, Param, Delete, UploadedFiles, UseInterceptors, Get, Query } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Post as PostEntity } from './post.entity';

import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UsersService } from '../users/users.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/decorator/roles.decorator';
import { Role } from '../roles/enum/role.enum';
import { ServiceType } from './enum/service-type.enum';
import { AnimalType } from './enum/animal-type.enum';
import { AnimalSize } from './enum/animal-size.enum';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService
  ) {}

    @Post('create')
    @Roles(Role.Admin)
    @UseInterceptors(FilesInterceptor('images'))
    async createPost(@Req() req, @Body() createPostDto: CreatePostDto) {
    if (createPostDto.services) {
      createPostDto.services = createPostDto.services.map(service => {
        if(service.serviceType) {
          service.serviceType = service.serviceType as ServiceType;
        }
        return service;
      });
    }
    if(createPostDto.animalType) {
      createPostDto.animalType = createPostDto.animalType as AnimalType;
    }
    if (createPostDto.animalSizes) {
      createPostDto.animalSizes = createPostDto.animalSizes as AnimalSize[];
    }
    const user = await this.usersService.findUserById(req.user.sub);
    return this.postsService.create(createPostDto, user);
}

@Put('add-images/:postId')
@Roles(Role.Admin)
@UseInterceptors(FilesInterceptor('images'))
async addImagesToPost(
  @Param('postId') postId: number, 
  @UploadedFiles() images: Array<Express.Multer.File>
) {
  return this.postsService.addImagesToPost(postId, images);
}

@Put('update/:id')
@Roles(Role.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(FilesInterceptor('images'))
async updatePost(
  @Param('id') id: number,
  @Body() updatePostDto: UpdatePostDto,
  @UploadedFiles() images: Array<Express.Multer.File>,
) {
  if (updatePostDto.services) {
    updatePostDto.services = updatePostDto.services.map((service) => ({
      ...service,
      serviceType: service.serviceType as ServiceType,
    }));
  }

  if (updatePostDto.animalType) {
    updatePostDto.animalType = updatePostDto.animalType as AnimalType;
  }

  if (updatePostDto.animalSizes) {
    updatePostDto.animalSizes = updatePostDto.animalSizes.map(
      (size) => size as AnimalSize,
    );
  }

  return this.postsService.update(id, updatePostDto, images);
}


  @Get("get-all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.User)
  async getAllPosts() {
    return this.postsService.findAll();
  }

  @Get('search')
async searchPosts(
  @Query('keywords') keywords?: string,
  @Query('serviceTypes') serviceTypes?: string[],
  @Query('animalType') animalType?: string,
  @Query('animalSizes') animalSizes?: string[]
): Promise<PostEntity[]> {
  return this.postsService.searchPosts(
    keywords,
    serviceTypes ? (Array.isArray(serviceTypes) ? serviceTypes.map(type => type as ServiceType) : [serviceTypes as ServiceType]) : undefined,
    animalType ? animalType as AnimalType : undefined,
    animalSizes ? (Array.isArray(animalSizes) ? animalSizes.map(size => size as AnimalSize) : [animalSizes as AnimalSize]) : undefined
  );
}
}
