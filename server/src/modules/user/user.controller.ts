import { Body, Controller, Get, Param, ParseIntPipe, Patch, Req, UseGuards } from "@nestjs/common";
import { RequestWithAccessToken } from "express";
import { AccessTokenGuard } from "../jwt/jwt-access-token.guard";
import { UserService } from "./user.service";

@Controller("user")
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(AccessTokenGuard)
  @Get("/")
  async getLoggedInUser(@Req() req: RequestWithAccessToken) {
    return this.userService.findUser(req.user.userId);
  }

  @UseGuards(AccessTokenGuard)
  @Get("/list")
  async getUserList() {
    return this.userService.findAllUser();
  }

  @UseGuards(AccessTokenGuard)
  @Get("/:user-id")
  async getUser(@Param("user-id", ParseIntPipe) userId: number) {
    return this.userService.findUser(userId);
  }

  @UseGuards(AccessTokenGuard)
  @Patch("/nickname")
  async patchNickname(@Req() req: RequestWithAccessToken, @Body("nickname") nickname: string) {
    return this.userService.updateUserNickname(req.user.userId, nickname);
  }

  @UseGuards(AccessTokenGuard)
  @Patch("/profile-image")
  async patchProfile(@Req() req: RequestWithAccessToken, @Body("profile-image") profileImage: string) {
    return this.userService.updateUserProfileImage(req.user.userId, profileImage);
  }
}
