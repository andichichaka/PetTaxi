import { Controller, Post, Body, UseGuards, Req, Put, Param, Delete, UploadedFiles, UseInterceptors, Get } from '@nestjs/common';
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
import { SearchPostsDto } from './dto/search-post.dto';

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
    if (createPostDto.serviceTypes) {
      createPostDto.serviceTypes = createPostDto.serviceTypes as ServiceType[];
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

  @Post('upload')
  @UseInterceptors(FilesInterceptor('images'))
  async testUpload(@UploadedFiles() files: Array<Express.Multer.File>) {
    console.log('Files received:', files);
    return { files };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @UseInterceptors(FilesInterceptor('images'))
  async updatePost(@Param('id') id: number, @Body() updatePostDto: UpdatePostDto, @UploadedFiles() images: Array<Express.Multer.File>) {
    return this.postsService.update(id, updatePostDto, images);
  }

  @Get("get-all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.User)
  async getAllPosts() {
    return this.postsService.findAll();
  }

  @Post('search')
  async searchPosts(@Body() searchPostsDto: SearchPostsDto): Promise<PostEntity[]> {
    const { keywords, serviceTypes, animalType, animalSizes } = searchPostsDto;

    return this.postsService.searchPosts(keywords, serviceTypes, animalType, animalSizes);
}
}
