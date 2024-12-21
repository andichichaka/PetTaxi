import { Controller, Post, Body, UseGuards, Req, Put, Param, Delete, UploadedFiles, UseInterceptors, Get } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UsersService } from '../users/users.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/decorator/roles.decorator';
import { Role } from '../roles/enum/role.enum';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService
  ) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @UseInterceptors(FilesInterceptor('images'))
  async createPost(@Req() req, @Body() createPostDto: CreatePostDto, @UploadedFiles() images: Array<Express.Multer.File>) {
    const user = await this.usersService.findUserById(req.user.sub);
    return this.postsService.create(createPostDto, user, images);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @UseInterceptors(FilesInterceptor('images'))
  async updatePost(@Param('id') id: number, @Body() updatePostDto: UpdatePostDto, @UploadedFiles() images: Array<Express.Multer.File>) {
    return this.postsService.update(id, updatePostDto, images);
  }
}
