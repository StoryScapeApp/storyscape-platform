import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}
  async getSummary(professorId: string) {
    const [studentGroups,sessions]=await Promise.all([
      this.prisma.readingSession.groupBy({by:['studentId'],where:{professorId}}),
      this.prisma.readingSession.findMany({where:{professorId},orderBy:[{startedAt:'desc'},{id:'desc'}],select:{id:true,studentId:true,startedAt:true,completedAt:true,student:{select:{id:true,code:true,name:true}},activityResponses:{select:{activityRefId:true,attemptNumber:true,isCorrect:true,questionText:true,chapterRefId:true,questionNumber:true}}}}),
    ]);
    const questionGroups=new Map<string,typeof sessions[number]['activityResponses']>();
    const perSession=new Map<string,{correctTotal:number;totalQuestions:number}>();
    for(const session of sessions){
      const byQuestion=new Map<string,typeof session.activityResponses>();
      for(const response of session.activityResponses){byQuestion.set(response.activityRefId,[...(byQuestion.get(response.activityRefId)??[]),response]);}
      let correctTotal=0;
      for(const [activityRefId,rows] of byQuestion){
        const questionKey=`${session.id}:${activityRefId}`;
        questionGroups.set(questionKey,rows);
        if(rows.some(row=>row.isCorrect))correctTotal++;
      }
      perSession.set(session.id,{correctTotal,totalQuestions:byQuestion.size});
    }
    let firstAttempt=0,secondAttempt=0,toReinforce=0;
    const reinforceGroups=new Map<string,{chapterTitle:string;questionText:string;failures:number;total:number}>();
    for(const rows of questionGroups.values()){
      const correct=rows.find(row=>row.isCorrect);
      if(correct?.attemptNumber===1)firstAttempt++;else if(correct?.attemptNumber===2)secondAttempt++;else if(!correct)toReinforce++;
      const first=rows[0];
      const chapterRefId=first.chapterRefId??first.activityRefId.split(':q')[0];
      const chapterNumber=chapterRefId.match(/^capitulo_(\d+)$/i)?.[1];
      const chapterTitle=chapterNumber?`Capítulo ${chapterNumber}`:chapterRefId.replace(/^capitulo_/i,'Capítulo ').replace(/_/g,' ');
      const questionId=first.chapterRefId&&first.questionNumber!==null?`${first.chapterRefId}:q${first.questionNumber}`:first.activityRefId;
      const entry=reinforceGroups.get(questionId)??{chapterTitle,questionText:first.questionText??'',failures:0,total:0};
      entry.total++;
      if(!correct)entry.failures++;
      reinforceGroups.set(questionId,entry);
    }
    const questionTotal=questionGroups.size;
    const percent=(count:number)=>questionTotal?Math.round(count*100/questionTotal):0;
    const recent=sessions.slice(0,5).map(session=>({sessionId:session.id,studentId:session.student.id,studentCode:session.student.code,studentName:session.student.name,startedAt:session.startedAt,completedAt:session.completedAt,correctTotal:perSession.get(session.id)?.correctTotal??0,totalQuestions:perSession.get(session.id)?.totalQuestions??0}));
    const reinforce=[...reinforceGroups.values()].filter(item=>item.failures>0).sort((a,b)=>b.failures-a.failures||a.chapterTitle.localeCompare(b.chapterTitle)||a.questionText.localeCompare(b.questionText)).slice(0,3);
    return {totals:{students:studentGroups.length,sessions:sessions.length,completedSessions:sessions.filter(session=>session.completedAt!==null).length,answeredQuestions:questionTotal},rates:{firstAttempt:percent(firstAttempt),secondAttempt:percent(secondAttempt),toReinforce:percent(toReinforce)},recent,reinforce};
  }
}
